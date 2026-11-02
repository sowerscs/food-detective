#!/usr/bin/env python3
"""Food Detective weekly report.

Reads one week of the family journal from Firestore (the same database the app syncs to)
and writes report.html, report.txt and report.json next to this script.

Usage:
  FD_FAMILY_CODE=YOUR-CODE python3 report.py            # last full week (Monday to Sunday)
  FD_FAMILY_CODE=YOUR-CODE python3 report.py 2026-11-02 # a specific week, given its Monday

Only the family code hash is sent to Firestore. The web API key below is the app's public key,
access is controlled by the database rules, not by the key.
"""
import datetime as dt
import hashlib
import json
import os
import re
import sys
import urllib.request
import urllib.error

API_KEY = "AIzaSyAll5XE3Afsy4a3qvKTsCQr1q3p9QovLe4"
PROJECT = "food-explorer-7f778"
MEALS = [("breakfast", "Breakfast"), ("lunch", "Lunch"), ("dinner", "Dinner"), ("snack", "Snacks")]
GROUPS = {"fruit": "Fruits", "veg": "Veggies", "grain": "Grains", "protein": "Protein", "dairy": "Dairy"}


def week_start(d):
    return d - dt.timedelta(days=d.weekday())


def normalize_code(code):
    return re.sub(r"\s+", "-", code.strip().upper())


def family_path(code):
    return "families/" + hashlib.sha256(normalize_code(code).encode("ascii")).hexdigest()


def http(url, data=None, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        return e.code, body


def sign_in():
    status, body = http("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + API_KEY, {"returnSecureToken": True})
    if status != 200 or not isinstance(body, dict) or "idToken" not in body:
        raise SystemExit("Could not sign in to Firebase (HTTP %s): %s" % (status, str(body)[:300]))
    return body["idToken"]


def decode(v):
    """Firestore REST typed value to plain Python."""
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return v["doubleValue"]
    if "booleanValue" in v:
        return v["booleanValue"]
    if "nullValue" in v:
        return None
    if "mapValue" in v:
        return {k: decode(x) for k, x in (v["mapValue"].get("fields") or {}).items()}
    if "arrayValue" in v:
        return [decode(x) for x in (v["arrayValue"].get("values") or [])]
    if "timestampValue" in v:
        return v["timestampValue"]
    return None


def get_doc(token, path):
    url = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/%s" % (PROJECT, path)
    status, body = http(url, None, token)
    if status == 404:
        return None
    if status != 200:
        raise SystemExit("Firestore read failed (HTTP %s): %s" % (status, str(body)[:300]))
    return decode({"mapValue": {"fields": body.get("fields", {})}})


def query_days(token, fam, ws, we):
    url = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/%s:runQuery" % (PROJECT, fam)
    q = {"structuredQuery": {"from": [{"collectionId": "days"}], "where": {"compositeFilter": {"op": "AND", "filters": [
        {"fieldFilter": {"field": {"fieldPath": "date"}, "op": "GREATER_THAN_OR_EQUAL", "value": {"stringValue": ws}}},
        {"fieldFilter": {"field": {"fieldPath": "date"}, "op": "LESS_THAN_OR_EQUAL", "value": {"stringValue": we}}}]}}}}
    status, body = http(url, q, token)
    if status != 200:
        raise SystemExit("Firestore query failed (HTTP %s): %s" % (status, str(body)[:300]))
    out = []
    for row in body:
        if "document" in row:
            out.append(decode({"mapValue": {"fields": row["document"].get("fields", {})}}))
    return out


def basic_report(days, ws, we):
    """Fallback when no report document exists for the week. Built from the day records only."""
    by_date = {d.get("date"): d for d in days}
    rep = {"version": 0, "weekStart": ws, "weekEnd": we, "name": "", "showNumbers": True, "refKcal": None,
           "week": {"daysLogged": 0, "fueledDays": 0, "stars": None, "missionsDone": None, "distinctFoods": 0, "newFoods": [],
                    "waterAvg": 0, "energyAvg": None, "energyDays": 0, "groupDays": {g: 0 for g in GROUPS}, "sweetDrinks": 0,
                    "lessonsThisWeek": [], "badgesThisWeek": [], "habits": [], "totals": {}, "avgPerLoggedDay": None},
           "days": [], "recommendations": [], "fallback": True}
    names = set(); water = 0; esum = 0; edays = 0; tot = {"kcal": 0, "p": 0, "c": 0, "f": 0}
    start = dt.date.fromisoformat(ws)
    for i in range(7):
        date = (start + dt.timedelta(days=i)).isoformat()
        d = by_date.get(date) or {}
        entries = d.get("entries") or []
        meals = {m: [] for m, _ in MEALS}
        groups = set(); dkcal = dp = dc = df = 0.0
        for e in entries:
            per = e.get("per") or {}; q = float(e.get("qty") or 1)
            kcal = float(per.get("kcal") or 0) * q; p = float(per.get("p") or 0) * q; c = float(per.get("c") or 0) * q; f = float(per.get("f") or 0) * q
            dkcal += kcal; dp += p; dc += c; df += f
            for g in e.get("groups") or []:
                groups.add(g)
            names.add((e.get("name") or "").strip().lower())
            meals.setdefault(e.get("meal") or "snack", []).append({"name": e.get("name"), "amount": "%g x %s" % (q, e.get("serving") or "serving"), "kcal": round(kcal), "p": round(p, 1), "c": round(c, 1), "f": round(f, 1), "groups": e.get("groups") or [], "level": e.get("level"), "traits": []})
        logged = bool(entries)
        fueled = logged and all(meals.get(m) for m in ("breakfast", "lunch", "dinner")) and len(groups) >= 3
        if logged:
            rep["week"]["daysLogged"] += 1; tot["kcal"] += dkcal; tot["p"] += dp; tot["c"] += dc; tot["f"] += df
            for g in groups:
                if g in GROUPS:
                    rep["week"]["groupDays"][g] += 1
        if fueled:
            rep["week"]["fueledDays"] += 1
        water += int(d.get("water") or 0)
        if d.get("energy"):
            esum += int(d["energy"]); edays += 1
        rep["days"].append({"date": date, "weekday": (start + dt.timedelta(days=i)).strftime("%A"), "logged": logged, "fueled": fueled, "water": int(d.get("water") or 0), "energy": d.get("energy"), "energyName": {1: "Sleepy", 2: "Okay", 3: "Good", 4: "Super"}.get(d.get("energy"), ""), "stars": None, "missions": [], "groups": sorted(groups), "meals": meals, "totals": {"kcal": round(dkcal), "p": round(dp, 1), "c": round(dc, 1), "f": round(df, 1)}})
    n = rep["week"]["daysLogged"]
    rep["week"]["distinctFoods"] = len(names); rep["week"]["waterAvg"] = round(water / n, 1) if n else 0
    rep["week"]["energyAvg"] = round(esum / edays, 1) if edays else None; rep["week"]["energyDays"] = edays
    rep["week"]["totals"] = {k: round(v) for k, v in tot.items()}
    rep["week"]["avgPerLoggedDay"] = {k: round(v / n) for k, v in tot.items()} if n else None
    return rep


def esc(s):
    return str(s if s is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def nice(date):
    d = dt.date.fromisoformat(date)
    return d.strftime("%a %b ") + str(d.day)


def render(rep):
    w = rep["week"]; name = rep.get("name") or "your detective"; show = True
    ws, we = rep["weekStart"], rep["weekEnd"]
    title = "Food Detective weekly report, %s to %s" % (nice(ws), nice(we))
    css_card = "background:#f3f8fd;border-radius:12px;padding:12px 14px;margin:10px 0;"
    tile = lambda v, l: '<td style="padding:8px 10px;text-align:center"><div style="font-size:24px;font-weight:700;color:#2b3d57">%s</div><div style="font-size:12px;color:#64789a;font-weight:700;text-transform:uppercase">%s</div></td>' % (esc(v), esc(l))
    h = ['<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2b3d57;max-width:680px;margin:0 auto;font-size:15px;line-height:1.45">']
    h.append('<h1 style="font-size:22px;margin:0 0 4px">%s</h1><div style="color:#64789a;font-weight:700;margin-bottom:12px">Food Detective, %s</div>' % (esc(title), esc(name)))
    h.append("<!--NARRATIVE-->")
    # week tiles
    h.append('<div style="%s"><table style="width:100%%;border-collapse:collapse"><tr>%s%s%s%s</tr></table></div>' % (css_card,
             tile("%d/7" % w["daysLogged"], "days logged"), tile(w["fueledDays"], "fueled days"), tile(w["stars"] if w.get("stars") is not None else "n/a", "stars"), tile(w["distinctFoods"], "different foods")))
    # goals
    g = w.get("weeklyGoal"); m = w.get("monthlyGoal")
    if g:
        h.append('<div style="%s"><b>Goals</b><div style="margin-top:6px">Weekly star goal, %s of %s. %s%s</div>' % (css_card, g["n"], g["goal"], "Reached" if g["reached"] else "Not reached", (", reward given." if g.get("given") else ", reward not yet marked as given.") if g["reached"] else "."))
        if g.get("reward"):
            h.append('<div style="color:#64789a">Reward on the table, %s</div>' % esc(g["reward"]))
        if m:
            mk_ = m.get("key", "")
            try:
                mname = dt.date(int(mk_[:4]), int(mk_[5:7]), 1).strftime("%B %Y")
            except Exception:
                mname = mk_
            h.append('<div style="margin-top:6px">Monthly goal for %s, %s of %s so far.</div>' % (esc(mname), m["n"], m["goal"]))
        ch = w.get("challenge")
        if ch:
            h.append('<div style="margin-top:6px">Case of the week, %s. %s of %s%s</div>' % (esc(ch["name"]), ch["n"], ch["target"], ", solved." if ch["done"] else "."))
        if w.get("missionsDone") is not None:
            h.append('<div style="margin-top:6px">Daily missions completed, %s of %s.</div>' % (w["missionsDone"], w.get("missionsTotal", 21)))
        h.append("</div>")
    # habits and progress
    extras = []
    if w.get("lessonsThisWeek"):
        extras.append("Lessons finished, " + ", ".join(w["lessonsThisWeek"]) + ".")
    if w.get("badgesThisWeek"):
        extras.append("Badges earned, " + ", ".join(w["badgesThisWeek"]) + ".")
    if w.get("newFoods"):
        extras.append("New foods tried, " + ", ".join(w["newFoods"][:12]) + ".")
    for hb in w.get("habits") or []:
        extras.append("Habit, %s. %s of 7 days this week, %s of %s overall%s." % (hb["name"], hb["doneThisWeek"], hb["days"], hb["goal"], (", " + hb["level"]) if hb.get("level") else ""))
    if w.get("rank"):
        extras.append("Rank, %s, with %s lifetime stars and a %s day streak." % (w["rank"], w.get("lifetimeStars"), w.get("streak")))
    if extras:
        h.append('<div style="%s"><b>Progress</b><ul style="margin:6px 0 0 18px;padding:0">%s</ul></div>' % (css_card, "".join("<li>%s</li>" % esc(x) for x in extras)))
    # food groups and habits of eating
    gd = w.get("groupDays") or {}
    h.append('<div style="%s"><b>Food groups, days out of %d logged</b><div style="margin-top:6px">%s</div><div style="margin-top:6px;color:#64789a">Water averaged %s cups on logged days. Energy check-ins, %s%s. Sweet drinks logged, %s.</div></div>' % (
        css_card, w["daysLogged"], " &middot; ".join("%s %s" % (esc(GROUPS[k]), gd.get(k, 0)) for k in GROUPS), w.get("waterAvg", 0), w.get("energyDays", 0),
        (" (average %s of 4)" % w["energyAvg"]) if w.get("energyAvg") else "", w.get("sweetDrinks", 0)))
    # by day table
    rows = []
    for d in rep["days"]:
        meals_logged = "".join("B" if d["meals"].get("breakfast") else "&middot;") + "".join("L" if d["meals"].get("lunch") else "&middot;") + "".join("D" if d["meals"].get("dinner") else "&middot;") + "".join("S" if d["meals"].get("snack") else "&middot;")
        groups = "".join({"fruit": "&#127822;", "veg": "&#129382;", "grain": "&#127806;", "protein": "&#127831;", "dairy": "&#129371;"}.get(x, "") for x in d.get("groups") or [])
        rows.append("<tr><td style='padding:6px 8px;border-top:1px solid #dbe8f3'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;font-family:monospace'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;text-align:center'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;text-align:center'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;text-align:center'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;text-align:right'>%s</td><td style='padding:6px 8px;border-top:1px solid #dbe8f3;text-align:right'>%s</td></tr>" % (
            esc(nice(d["date"])), meals_logged, groups, "&#10003;" if d["fueled"] else "", d["water"] or "", esc(d.get("energyName") or ""), d["stars"] if d.get("stars") is not None else "", (d["totals"].get("kcal") if d["logged"] else "") if show else ""))
    h.append('<div style="%s"><b>By day</b><table style="width:100%%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="color:#64789a"><th align="left" style="padding:4px 8px">Day</th><th align="left" style="padding:4px 8px">Meals</th><th align="left" style="padding:4px 8px">Groups</th><th style="padding:4px 8px">Fueled</th><th style="padding:4px 8px">Water</th><th style="padding:4px 8px">Energy</th><th style="padding:4px 8px">Stars</th><th style="padding:4px 8px">%s</th></tr>%s</table><div style="color:#64789a;font-size:12px;margin-top:4px">Meals column, B breakfast, L lunch, D dinner, S snacks. Fueled means breakfast, lunch and dinner logged with 3 or more food groups.</div></div>' % (css_card, "Calories" if show else "", "".join(rows)))
    # per meal detail
    h.append('<div style="%s"><b>Per meal</b>' % css_card)
    for d in rep["days"]:
        if not d["logged"]:
            continue
        h.append('<div style="margin-top:10px"><b>%s</b>%s</div>' % (esc(nice(d["date"])), (" &middot; %s cal, P %s g, C %s g, F %s g" % (d["totals"].get("kcal"), d["totals"].get("p"), d["totals"].get("c"), d["totals"].get("f"))) if show else ""))
        for mid, mname in MEALS:
            items = d["meals"].get(mid) or []
            if not items:
                continue
            mk = sum(int(x.get("kcal") or 0) for x in items)
            h.append('<div style="margin:3px 0 0 10px"><span style="color:#64789a;font-weight:700">%s%s</span><ul style="margin:2px 0 0 18px;padding:0">%s</ul></div>' % (esc(mname), (" (%s cal)" % mk) if show else "", "".join("<li>%s, %s%s%s</li>" % (esc(x["name"]), esc(x["amount"]), (" (%s cal)" % x["kcal"]) if show else "", (" &middot; " + esc(", ".join(x["traits"]))) if x.get("traits") else "") for x in items)))
    h.append("</div>")
    # totals for the parent
    if show and w.get("avgPerLoggedDay"):
        a = w["avgPerLoggedDay"]
        h.append('<div style="%s"><b>Averages per logged day</b><div style="margin-top:6px">%s calories, protein %s g, carbs %s g, fat %s g%s%s</div>%s</div>' % (css_card, a.get("kcal"), a.get("p"), a.get("c"), a.get("f"), (", fiber %s g" % a["fiber"]) if a.get("fiber") is not None else "", (", added sugar %s g, sodium %s mg" % (a.get("added"), a.get("sodium"))) if a.get("sodium") is not None else "", ('<div style="color:#64789a;font-size:13px;margin-top:4px">For reference, a typical day for her age and activity level is about %s calories. Logged days only, and a partly logged day counts low.</div>' % rep["refKcal"]) if rep.get("refKcal") else ""))
    # recommendations
    recs = rep.get("recommendations") or []
    if recs:
        h.append('<div style="%s"><b>Suggestions from the app</b><ul style="margin:6px 0 0 18px;padding:0">%s</ul></div>' % (css_card, "".join("<li>%s</li>" % esc(r["text"]) for r in recs)))
    if rep.get("fallback"):
        h.append('<div style="color:#64789a;font-size:13px">No device synced after the week ended, so this report was built from the raw log. Stars and missions are not included.</div>')
    h.append('<div style="color:#64789a;font-size:12px;margin-top:14px">Food Detective keeps numbers in the Chief&#8217;s office. She sees the fuel tank, missions, stars and swap ideas. Nothing in the app is tied to eating less.</div></div>')
    html = "".join(h)
    # plain text
    t = [title, ""]
    t.append("Days logged %d/7. Fueled days %s. Stars %s. Different foods %s." % (w["daysLogged"], w["fueledDays"], w.get("stars"), w["distinctFoods"]))
    if g:
        t.append("Weekly star goal %s of %s, %s." % (g["n"], g["goal"], "reached" if g["reached"] else "not reached"))
    for x in extras:
        t.append(x)
    t.append("")
    for d in rep["days"]:
        t.append("%s, %s%s, water %s, energy %s%s" % (nice(d["date"]), "logged" if d["logged"] else "nothing logged", ", fueled" if d["fueled"] else "", d["water"], d.get("energyName") or "none", (", %s cal" % d["totals"].get("kcal")) if (show and d["logged"]) else ""))
        for mid, mname in MEALS:
            for x in d["meals"].get(mid) or []:
                t.append("   %s, %s, %s%s" % (mname, x["name"], x["amount"], (" (%s cal)" % x["kcal"]) if show else ""))
    if recs:
        t.append("")
        t.append("Suggestions")
        for r in recs:
            t.append("- " + r["text"])
    return title, html, "\n".join(t)


def main():
    code = os.environ.get("FD_FAMILY_CODE", "").strip()
    if not code:
        raise SystemExit("Set FD_FAMILY_CODE to the family code used in the app.")
    if len(sys.argv) > 1:
        ws_date = dt.date.fromisoformat(sys.argv[1])
    else:
        ws_date = week_start(dt.date.today() - dt.timedelta(days=7))
    ws = ws_date.isoformat(); we = (ws_date + dt.timedelta(days=6)).isoformat()
    fam = family_path(code)
    token = sign_in()
    rep = get_doc(token, fam + "/reports/" + ws)
    if not rep or not isinstance(rep.get("days"), list):
        days = query_days(token, fam, ws, we)
        if not days:
            raise SystemExit("No journal entries found for the week of %s. Check the family code and that a device has synced." % ws)
        rep = basic_report(days, ws, we)
    title, html, text = render(rep)
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "report.json"), "w") as f:
        json.dump(rep, f, indent=1)
    with open(os.path.join(here, "report.html"), "w") as f:
        f.write(html)
    with open(os.path.join(here, "report.txt"), "w") as f:
        f.write(text)
    print("TITLE: " + title)
    print("Wrote report.html, report.txt and report.json for %s to %s (%s)." % (ws, we, "app report" if not rep.get("fallback") else "basic fallback"))


if __name__ == "__main__":
    main()
