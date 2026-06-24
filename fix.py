import sys

filepath = r"d:\Work\clnic-backup\clinic-management-system\lib\rmo-fields.ts"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(333, 380): # 0-indexed, so lines 334 to 380
    if "personal_history__gpe_" in lines[i] or "personal_history__general_physical_examination_note" in lines[i]:
        lines[i] = lines[i].replace('s: "personal_history"', 's: "examination_summary"')

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Done")
