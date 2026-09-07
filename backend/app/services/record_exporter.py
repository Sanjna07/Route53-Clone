from typing import List, Dict, Any

class RecordExporter:
    @staticmethod
    def export_to_json(zone: Dict[str, Any], records: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "hosted_zone": {
                "id": zone.get("id"),
                "name": zone.get("name"),
                "comment": zone.get("comment"),
                "is_private": zone.get("is_private"),
                "created_at": str(zone.get("created_at")),
            },
            "records": records
        }

    @staticmethod
    def export_to_bind(zone_name: str, records: List[Dict[str, Any]]) -> str:
        domain = zone_name.strip()
        if not domain.endswith("."):
            domain += "."

        lines = []
        lines.append(f"; BIND Zone File for {domain}")
        lines.append(f"; Exported from AWS Route 53 Clone")
        lines.append(f"$ORIGIN {domain}")
        lines.append(f"$TTL 300\n")

        for rec in records:
            name = rec["name"]
            # Convert absolute name to relative if it ends with domain
            if name == domain:
                rel_name = "@"
            elif name.endswith("." + domain):
                rel_name = name[:-len("." + domain)]
            elif name.endswith(domain):
                rel_name = name[:-len(domain)]
            else:
                rel_name = name

            rec_type = rec["type"].upper()
            ttl = rec.get("ttl", 300)
            values = rec.get("values", [])

            for val in values:
                lines.append(f"{rel_name:<16} {ttl:<6} IN  {rec_type:<6} {val}")

        return "\n".join(lines)
