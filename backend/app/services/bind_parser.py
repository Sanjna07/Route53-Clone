import re
from typing import List, Dict, Any

class BINDParser:
    @staticmethod
    def parse(bind_content: str, default_zone_name: str = "") -> List[Dict[str, Any]]:
        """
        Parses BIND zone file lines into structured record dictionaries.
        """
        records: List[Dict[str, Any]] = []
        origin = default_zone_name.strip()
        default_ttl = 300

        lines = bind_content.splitlines()
        
        # Temporary map to group multiple values for same record (name + type)
        grouped_records: Dict[str, Dict[str, Any]] = {}

        for line in lines:
            # Strip comments
            line = line.split(";")[0].strip()
            if not line:
                continue

            # Handle directives ($ORIGIN, $TTL)
            if line.startswith("$ORIGIN"):
                parts = line.split()
                if len(parts) >= 2:
                    origin = parts[1].strip()
                continue
            if line.startswith("$TTL"):
                parts = line.split()
                if len(parts) >= 2 and parts[1].isdigit():
                    default_ttl = int(parts[1])
                continue

            # Tokenize record line
            tokens = line.split()
            if len(tokens) < 3:
                continue

            name = tokens[0]
            idx = 1
            ttl = default_ttl

            # Check if second token is numeric TTL
            if tokens[idx].isdigit():
                ttl = int(tokens[idx])
                idx += 1

            # Skip 'IN' class token if present
            if idx < len(tokens) and tokens[idx].upper() == "IN":
                idx += 1

            if idx >= len(tokens):
                continue

            rec_type = tokens[idx].upper()
            idx += 1

            if idx >= len(tokens):
                continue

            value = " ".join(tokens[idx:]).strip()

            # Ignore SOA or unknown directives if present
            if rec_type not in ("A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"):
                continue

            group_key = f"{name.lower()}::{rec_type}"
            if group_key not in grouped_records:
                grouped_records[group_key] = {
                    "name": name,
                    "type": rec_type,
                    "ttl": ttl,
                    "values": [value]
                }
            else:
                grouped_records[group_key]["values"].append(value)

        return list(grouped_records.values())
