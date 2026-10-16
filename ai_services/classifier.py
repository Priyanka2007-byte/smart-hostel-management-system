import re

class ComplaintClassifier:
    def __init__(self):
        self.categories = {
            "Electrical": ["light", "fan", "switch", "wire", "plug", "power", "socket", "spark", "voltage", "bulb", "mcb", "trip", "heater", "ac"],
            "Plumbing": ["water", "tap", "pipe", "leak", "flush", "drain", "sink", "geyser", "shower", "clogged", "overflow", "toilet"],
            "Housekeeping": ["dust", "dirty", "sweep", "clean", "mop", "trash", "garbage", "smell", "pest", "cockroach", "bedbug"],
            "Carpentry": ["door", "window", "lock", "handle", "cupboard", "table", "chair", "bed", "hinge", "latch"],
            "Wi-Fi / Network": ["wifi", "internet", "router", "lan", "connection", "speed", "slow", "disconnect", "network"]
        }
        self.emergency_keywords = ["spark", "fire", "smoke", "shock", "flood", "burst", "broken lock", "hazard"]

    def analyze(self, title: str, description: str):
        text = f"{title} {description}".lower()
        detected_category = "General"
        max_matches = 0

        for category, keywords in self.categories.items():
            matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text))
            if matches > max_matches:
                max_matches = matches
                detected_category = category

        is_emergency = any(em in text for em in self.emergency_keywords)
        if is_emergency:
            priority = "Urgent"
            sla_hours = 24
        elif detected_category in ["Electrical", "Plumbing"]:
            priority = "High"
            sla_hours = 48
        else:
            priority = "Medium"
            sla_hours = 72

        return {
            "category": detected_category,
            "priority": priority,
            "sla_hours": sla_hours,
            "confidence": round(min(0.98, 0.55 + (max_matches * 0.12)), 2)
        }

classifier = ComplaintClassifier()