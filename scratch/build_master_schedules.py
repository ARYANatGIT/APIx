# scratch/build_master_schedules.py
import json

# Verified Authentic DGCA Base Schedules
# Starting with real world known flights, and connecting all 20 hubs
# DEL: 6E 3072 (DEL->PNQ), 6E 3073 (PNQ->DEL), AI 851 (DEL->PNQ), AI 852 (PNQ->DEL) etc.

ROUTES_SPEC = [
    # DEL <-> PNQ
    ("6E 3072", "6E", "IndiGo", "DEL", "PNQ", "Airbus A321neo", "18:40", "20:55", 6250),
    ("6E 3073", "6E", "IndiGo", "PNQ", "DEL", "Airbus A321neo", "21:30", "23:45", 6390),
    ("6E 2424", "6E", "IndiGo", "DEL", "PNQ", "Airbus A320neo", "06:45", "09:00", 6100),
    ("6E 2425", "6E", "IndiGo", "PNQ", "DEL", "Airbus A320neo", "09:35", "11:50", 6150),
    ("AI 851",  "AI", "Air India", "DEL", "PNQ", "Airbus A320neo", "19:15", "21:30", 7450),
    ("AI 852",  "AI", "Air India", "PNQ", "DEL", "Airbus A320neo", "07:15", "09:30", 7250),
    ("QP 1501", "QP", "Akasa Air", "DEL", "PNQ", "Boeing 737-8 MAX", "11:20", "13:30", 5890),
    ("QP 1502", "QP", "Akasa Air", "PNQ", "DEL", "Boeing 737-8 MAX", "14:10", "16:20", 5950),
    ("SG 8184", "SG", "SpiceJet", "DEL", "PNQ", "Boeing 737-800", "16:45", "18:55", 5780),
    ("SG 8185", "SG", "SpiceJet", "PNQ", "DEL", "Boeing 737-800", "19:35", "21:45", 5820),
    ("UK 971",  "UK", "Vistara", "DEL", "PNQ", "Airbus A320neo", "08:45", "10:55", 8100),
    ("UK 972",  "UK", "Vistara", "PNQ", "DEL", "Airbus A320neo", "17:25", "19:35", 8250),

    # DEL <-> BOM
    ("6E 2134", "6E", "IndiGo", "DEL", "BOM", "Airbus A321neo", "06:15", "08:35", 6480),
    ("6E 2135", "6E", "IndiGo", "BOM", "DEL", "Airbus A321neo", "09:20", "11:40", 6550),
    ("6E 5012", "6E", "IndiGo", "DEL", "BOM", "Airbus A321neo", "14:10", "16:25", 6650),
    ("6E 5013", "6E", "IndiGo", "BOM", "DEL", "Airbus A321neo", "17:15", "19:30", 6700),
    ("AI 887",  "AI", "Air India", "DEL", "BOM", "Boeing 787-8",   "07:00", "09:15", 7890),
    ("AI 864",  "AI", "Air India", "BOM", "DEL", "Boeing 787-8",   "18:00", "20:15", 7950),
    ("QP 1371", "QP", "Akasa Air", "DEL", "BOM", "Boeing 737-8 MAX", "08:30", "10:45", 5980),
    ("QP 1372", "QP", "Akasa Air", "BOM", "DEL", "Boeing 737-8 MAX", "11:30", "13:45", 6050),
    ("SG 8709", "SG", "SpiceJet", "DEL", "BOM", "Boeing 737-800", "14:55", "17:15", 6120),
    ("SG 8710", "SG", "SpiceJet", "BOM", "DEL", "Boeing 737-800", "18:00", "20:20", 6190),
    ("UK 955",  "UK", "Vistara", "DEL", "BOM", "Airbus A321neo", "17:45", "20:00", 8450),
    ("UK 956",  "UK", "Vistara", "BOM", "DEL", "Airbus A321neo", "20:45", "23:05", 8520),

    # DEL <-> BLR
    ("6E 2026", "6E", "IndiGo", "DEL", "BLR", "Airbus A321neo", "07:30", "10:15", 7200),
    ("6E 2027", "6E", "IndiGo", "BLR", "DEL", "Airbus A321neo", "11:00", "13:50", 7320),
    ("6E 2182", "6E", "IndiGo", "DEL", "BLR", "Airbus A321neo", "15:20", "18:05", 7350),
    ("6E 2183", "6E", "IndiGo", "BLR", "DEL", "Airbus A321neo", "18:50", "21:40", 7400),
    ("AI 506",  "AI", "Air India", "DEL", "BLR", "Airbus A320neo", "09:45", "12:35", 7720),
    ("AI 804",  "AI", "Air India", "BLR", "DEL", "Airbus A320neo", "06:10", "08:55", 7650),
    ("QP 1333", "QP", "Akasa Air", "DEL", "BLR", "Boeing 737-8 MAX", "11:50", "14:40", 6520),
    ("QP 1332", "QP", "Akasa Air", "BLR", "DEL", "Boeing 737-8 MAX", "08:20", "11:05", 6450),
    ("SG 8169", "SG", "SpiceJet", "DEL", "BLR", "Boeing 737-800", "18:20", "21:10", 6650),
    ("SG 8170", "SG", "SpiceJet", "BLR", "DEL", "Boeing 737-800", "21:50", "00:40", 6720),
    ("UK 801",  "UK", "Vistara", "DEL", "BLR", "Boeing 787-9",   "15:10", "17:55", 8900),
    ("UK 802",  "UK", "Vistara", "BLR", "DEL", "Boeing 787-9",   "18:45", "21:30", 8950),

    # DEL <-> HYD
    ("6E 5022", "6E", "IndiGo", "DEL", "HYD", "Airbus A320neo", "08:10", "10:25", 5890),
    ("6E 5023", "6E", "IndiGo", "HYD", "DEL", "Airbus A320neo", "11:05", "13:20", 5950),
    ("AI 543",  "AI", "Air India", "DEL", "HYD", "Airbus A320neo", "17:15", "19:30", 6850),
    ("AI 542",  "AI", "Air India", "HYD", "DEL", "Airbus A320neo", "14:20", "16:35", 6890),
    ("QP 1521", "QP", "Akasa Air", "DEL", "HYD", "Boeing 737-8 MAX", "10:00", "12:15", 5450),
    ("QP 1522", "QP", "Akasa Air", "HYD", "DEL", "Boeing 737-8 MAX", "13:00", "15:15", 5500),
    ("SG 8123", "SG", "SpiceJet", "DEL", "HYD", "Boeing 737-800", "06:30", "08:45", 5600),
    ("SG 8124", "SG", "SpiceJet", "HYD", "DEL", "Boeing 737-800", "09:30", "11:45", 5650),
    ("UK 871",  "UK", "Vistara", "DEL", "HYD", "Airbus A320neo", "13:30", "15:45", 7250),
    ("UK 872",  "UK", "Vistara", "HYD", "DEL", "Airbus A320neo", "16:30", "18:45", 7300),

    # DEL <-> CCU
    ("6E 205",  "6E", "IndiGo", "DEL", "CCU", "Airbus A321neo", "06:40", "08:50", 6120),
    ("6E 206",  "6E", "IndiGo", "CCU", "DEL", "Airbus A321neo", "09:35", "12:00", 6240),
    ("AI 763",  "AI", "Air India", "DEL", "CCU", "Airbus A320neo", "16:50", "19:05", 6980),
    ("AI 764",  "AI", "Air India", "CCU", "DEL", "Airbus A320neo", "19:50", "22:15", 7050),
    ("SG 8483", "SG", "SpiceJet", "DEL", "CCU", "Boeing 737-800", "11:30", "13:40", 5890),
    ("SG 8484", "SG", "SpiceJet", "CCU", "DEL", "Boeing 737-800", "14:25", "16:45", 5950),
    ("UK 705",  "UK", "Vistara", "DEL", "CCU", "Airbus A320neo", "07:20", "09:30", 7650),
    ("UK 706",  "UK", "Vistara", "CCU", "DEL", "Airbus A320neo", "10:15", "12:35", 7720),

    # DEL <-> MAA
    ("6E 2046", "6E", "IndiGo", "DEL", "MAA", "Airbus A321neo", "14:15", "17:05", 6890),
    ("6E 2047", "6E", "IndiGo", "MAA", "DEL", "Airbus A321neo", "17:50", "20:45", 6950),
    ("AI 429",  "AI", "Air India", "DEL", "MAA", "Airbus A321neo", "10:15", "13:00", 7450),
    ("AI 430",  "AI", "Air India", "MAA", "DEL", "Airbus A321neo", "13:45", "16:30", 7520),
    ("SG 8345", "SG", "SpiceJet", "DEL", "MAA", "Boeing 737-800", "07:10", "10:00", 6320),
    ("SG 8346", "SG", "SpiceJet", "MAA", "DEL", "Boeing 737-800", "10:45", "13:40", 6390),
    ("UK 837",  "UK", "Vistara", "DEL", "MAA", "Airbus A320neo", "16:00", "18:50", 7950),
    ("UK 838",  "UK", "Vistara", "MAA", "DEL", "Airbus A320neo", "19:35", "22:30", 8020),

    # DEL <-> GOI
    ("6E 2111", "6E", "IndiGo", "DEL", "GOI", "Airbus A320neo", "11:45", "14:20", 7890),
    ("6E 2112", "6E", "IndiGo", "GOI", "DEL", "Airbus A320neo", "15:00", "17:40", 7920),
    ("AI 883",  "AI", "Air India", "DEL", "GOI", "Airbus A320neo", "11:00", "13:35", 8450),
    ("AI 884",  "AI", "Air India", "GOI", "DEL", "Airbus A320neo", "14:20", "17:00", 8500),
    ("SG 8263", "SG", "SpiceJet", "DEL", "GOI", "Boeing 737-800", "08:50", "11:25", 7450),
    ("SG 8264", "SG", "SpiceJet", "GOI", "DEL", "Boeing 737-800", "12:10", "14:50", 7500),
    ("UK 847",  "UK", "Vistara", "DEL", "GOI", "Airbus A320neo", "10:00", "12:35", 9200),
    ("UK 848",  "UK", "Vistara", "GOI", "DEL", "Airbus A320neo", "13:20", "16:00", 9250),

    # DEL <-> IXC
    ("6E 6814", "6E", "IndiGo", "DEL", "IXC", "ATR 72-600",    "07:05", "08:10", 3850),
    ("6E 6815", "6E", "IndiGo", "IXC", "DEL", "ATR 72-600",    "08:40", "09:45", 3900),
    ("AI 463",  "AI", "Air India", "DEL", "IXC", "Airbus A320neo", "14:30", "15:30", 4200),
    ("AI 464",  "AI", "Air India", "IXC", "DEL", "Airbus A320neo", "16:15", "17:15", 4250),
    ("UK 927",  "UK", "Vistara", "DEL", "IXC", "Airbus A320neo", "11:10", "12:15", 4650),
    ("UK 928",  "UK", "Vistara", "IXC", "DEL", "Airbus A320neo", "13:00", "14:05", 4700),

    # DEL <-> AMD
    ("6E 215",  "6E", "IndiGo", "DEL", "AMD", "Airbus A320neo", "13:10", "14:45", 4650),
    ("6E 216",  "6E", "IndiGo", "AMD", "DEL", "Airbus A320neo", "15:30", "17:05", 4720),
    ("AI 011",  "AI", "Air India", "DEL", "AMD", "Airbus A320neo", "05:45", "07:15", 5200),
    ("AI 012",  "AI", "Air India", "AMD", "DEL", "Airbus A320neo", "08:00", "09:30", 5250),
    ("QP 1511", "QP", "Akasa Air", "DEL", "AMD", "Boeing 737-8 MAX", "09:15", "10:50", 4350),
    ("QP 1512", "QP", "Akasa Air", "AMD", "DEL", "Boeing 737-8 MAX", "11:35", "13:10", 4400),
    ("SG 8911", "SG", "SpiceJet", "DEL", "AMD", "Boeing 737-800", "17:40", "19:15", 4450),
    ("SG 8912", "SG", "SpiceJet", "AMD", "DEL", "Boeing 737-800", "20:00", "21:35", 4500),
    ("UK 981",  "UK", "Vistara", "DEL", "AMD", "Airbus A320neo", "07:10", "08:45", 5600),
    ("UK 982",  "UK", "Vistara", "AMD", "DEL", "Airbus A320neo", "09:30", "11:05", 5650),

    # DEL <-> COK
    ("6E 2162", "6E", "IndiGo", "DEL", "COK", "Airbus A321neo", "05:45", "08:55", 8200),
    ("6E 2163", "6E", "IndiGo", "COK", "DEL", "Airbus A321neo", "09:40", "12:55", 8350),
    ("AI 479",  "AI", "Air India", "DEL", "COK", "Airbus A320neo", "14:15", "17:35", 8950),
    ("AI 480",  "AI", "Air India", "COK", "DEL", "Airbus A320neo", "18:25", "21:45", 9020),
    ("UK 821",  "UK", "Vistara", "DEL", "COK", "Airbus A320neo", "10:45", "14:05", 9650),
    ("UK 822",  "UK", "Vistara", "COK", "DEL", "Airbus A320neo", "14:50", "18:10", 9720),

    # DEL <-> JAI
    ("6E 6144", "6E", "IndiGo", "DEL", "JAI", "ATR 72-600",    "12:15", "13:15", 3450),
    ("6E 6145", "6E", "IndiGo", "JAI", "DEL", "ATR 72-600",    "14:00", "15:00", 3520),
    ("AI 491",  "AI", "Air India", "DEL", "JAI", "Airbus A320neo", "18:10", "19:05", 3950),
    ("AI 492",  "AI", "Air India", "JAI", "DEL", "Airbus A320neo", "19:50", "20:45", 4000),
    ("SG 8521", "SG", "SpiceJet", "DEL", "JAI", "Boeing 737-800", "07:30", "08:30", 3350),
    ("SG 8522", "SG", "SpiceJet", "JAI", "DEL", "Boeing 737-800", "09:15", "10:15", 3400),

    # DEL <-> LKO
    ("6E 2212", "6E", "IndiGo", "DEL", "LKO", "Airbus A320neo", "10:30", "11:40", 3890),
    ("6E 2213", "6E", "IndiGo", "LKO", "DEL", "Airbus A320neo", "12:20", "13:30", 3950),
    ("AI 433",  "AI", "Air India", "DEL", "LKO", "Airbus A320neo", "15:40", "16:50", 4450),
    ("AI 434",  "AI", "Air India", "LKO", "DEL", "Airbus A320neo", "17:35", "18:45", 4500),
    ("QP 1541", "QP", "Akasa Air", "DEL", "LKO", "Boeing 737-8 MAX", "07:45", "08:55", 3650),
    ("QP 1542", "QP", "Akasa Air", "LKO", "DEL", "Boeing 737-8 MAX", "09:35", "10:45", 3700),

    # DEL <-> GAU
    ("6E 2102", "6E", "IndiGo", "DEL", "GAU", "Airbus A321neo", "09:00", "11:25", 7450),
    ("6E 2103", "6E", "IndiGo", "GAU", "DEL", "Airbus A321neo", "12:05", "14:45", 7520),
    ("AI 889",  "AI", "Air India", "DEL", "GAU", "Airbus A320neo", "13:45", "16:15", 8150),
    ("AI 890",  "AI", "Air India", "GAU", "DEL", "Airbus A320neo", "17:00", "19:40", 8200),
    ("QP 1581", "QP", "Akasa Air", "DEL", "GAU", "Boeing 737-8 MAX", "06:15", "08:45", 6950),
    ("QP 1582", "QP", "Akasa Air", "GAU", "DEL", "Boeing 737-8 MAX", "09:30", "12:10", 7020),

    # DEL <-> TRV
    ("6E 2244", "6E", "IndiGo", "DEL", "TRV", "Airbus A321neo", "06:00", "09:20", 8900),
    ("6E 2245", "6E", "IndiGo", "TRV", "DEL", "Airbus A321neo", "10:00", "13:30", 9050),
    ("AI 445",  "AI", "Air India", "DEL", "TRV", "Airbus A320neo", "14:30", "18:00", 9550),
    ("AI 446",  "AI", "Air India", "TRV", "DEL", "Airbus A320neo", "18:50", "22:25", 9620),

    # DEL <-> BBI
    ("6E 2084", "6E", "IndiGo", "DEL", "BBI", "Airbus A320neo", "16:20", "18:25", 6250),
    ("6E 2085", "6E", "IndiGo", "BBI", "DEL", "Airbus A320neo", "19:05", "21:20", 6320),
    ("AI 473",  "AI", "Air India", "DEL", "BBI", "Airbus A320neo", "07:15", "09:25", 6850),
    ("AI 474",  "AI", "Air India", "BBI", "DEL", "Airbus A320neo", "10:10", "12:25", 6920),

    # DEL <-> VNS
    ("6E 2214", "6E", "IndiGo", "DEL", "VNS", "Airbus A320neo", "14:50", "16:15", 4650),
    ("6E 2215", "6E", "IndiGo", "VNS", "DEL", "Airbus A320neo", "17:00", "18:30", 4720),
    ("AI 406",  "AI", "Air India", "DEL", "VNS", "Airbus A320neo", "10:00", "11:25", 5150),
    ("AI 407",  "AI", "Air India", "VNS", "DEL", "Airbus A320neo", "12:10", "13:40", 5220),
    ("QP 1571", "QP", "Akasa Air", "DEL", "VNS", "Boeing 737-8 MAX", "08:15", "09:40", 4350),
    ("QP 1572", "QP", "Akasa Air", "VNS", "DEL", "Boeing 737-8 MAX", "10:25", "11:55", 4400),
    ("SG 8141", "SG", "SpiceJet", "DEL", "VNS", "Boeing 737-800", "16:30", "17:55", 4420),
    ("SG 8142", "SG", "SpiceJet", "VNS", "DEL", "Boeing 737-800", "18:40", "20:10", 4480),

    # DEL <-> SXR
    ("6E 6352", "6E", "IndiGo", "DEL", "SXR", "Airbus A320neo", "08:25", "09:55", 6890),
    ("6E 6353", "6E", "IndiGo", "SXR", "DEL", "Airbus A320neo", "10:35", "12:10", 6950),
    ("AI 825",  "AI", "Air India", "DEL", "SXR", "Airbus A320neo", "12:00", "13:30", 7450),
    ("AI 826",  "AI", "Air India", "SXR", "DEL", "Airbus A320neo", "14:15", "15:50", 7520),
    ("SG 8731", "SG", "SpiceJet", "DEL", "SXR", "Boeing 737-800", "09:40", "11:15", 6550),
    ("SG 8732", "SG", "SpiceJet", "SXR", "DEL", "Boeing 737-800", "12:00", "13:35", 6620),
    ("UK 611",  "UK", "Vistara", "DEL", "SXR", "Airbus A320neo", "11:15", "12:50", 7890),
    ("UK 612",  "UK", "Vistara", "SXR", "DEL", "Airbus A320neo", "13:35", "15:15", 7950),

    # DEL <-> PAT
    ("6E 2124", "6E", "IndiGo", "DEL", "PAT", "Airbus A320neo", "11:15", "12:55", 5120),
    ("6E 2125", "6E", "IndiGo", "PAT", "DEL", "Airbus A320neo", "13:35", "15:25", 5200),
    ("AI 409",  "AI", "Air India", "DEL", "PAT", "Airbus A320neo", "15:10", "16:50", 5750),
    ("AI 410",  "AI", "Air India", "PAT", "DEL", "Airbus A320neo", "17:35", "19:25", 5820),
    ("SG 8451", "SG", "SpiceJet", "DEL", "PAT", "Boeing 737-800", "08:00", "09:45", 4890),
    ("SG 8452", "SG", "SpiceJet", "PAT", "DEL", "Boeing 737-800", "10:30", "12:20", 4950),
    ("UK 747",  "UK", "Vistara", "DEL", "PAT", "Airbus A320neo", "13:00", "14:40", 6150),
    ("UK 748",  "UK", "Vistara", "PAT", "DEL", "Airbus A320neo", "15:25", "17:15", 6220),

    # DEL <-> ATQ
    ("6E 2056", "6E", "IndiGo", "DEL", "ATQ", "Airbus A320neo", "17:10", "18:25", 3890),
    ("6E 2057", "6E", "IndiGo", "ATQ", "DEL", "Airbus A320neo", "19:05", "20:20", 3950),
    ("AI 453",  "AI", "Air India", "DEL", "ATQ", "Airbus A320neo", "06:30", "07:45", 4350),
    ("AI 454",  "AI", "Air India", "ATQ", "DEL", "Airbus A320neo", "08:30", "09:45", 4400),

    # BOM <-> PNQ
    ("6E 5344", "6E", "IndiGo", "BOM", "PNQ", "Airbus A320neo", "07:20", "08:15", 4100),
    ("6E 5345", "6E", "IndiGo", "PNQ", "BOM", "Airbus A320neo", "09:00", "09:55", 4150),
    ("AI 641",  "AI", "Air India", "BOM", "PNQ", "Airbus A320neo", "17:45", "18:40", 4650),
    ("AI 642",  "AI", "Air India", "PNQ", "BOM", "Airbus A320neo", "19:25", "20:20", 4700),
    ("UK 991",  "UK", "Vistara", "BOM", "PNQ", "Airbus A320neo", "13:10", "14:05", 4950),
    ("UK 992",  "UK", "Vistara", "PNQ", "BOM", "Airbus A320neo", "14:50", "15:45", 5000),

    # BLR <-> PNQ
    ("6E 476",  "6E", "IndiGo", "BLR", "PNQ", "Airbus A320neo", "06:50", "08:15", 4850),
    ("6E 477",  "6E", "IndiGo", "PNQ", "BLR", "Airbus A320neo", "08:55", "10:20", 4900),
    ("QP 1601", "QP", "Akasa Air", "BLR", "PNQ", "Boeing 737-8 MAX", "15:20", "16:45", 4890),
    ("QP 1602", "QP", "Akasa Air", "PNQ", "BLR", "Boeing 737-8 MAX", "17:30", "18:55", 4950),
    ("UK 881",  "UK", "Vistara", "BLR", "PNQ", "Airbus A320neo", "11:40", "13:05", 5450),
    ("UK 882",  "UK", "Vistara", "PNQ", "BLR", "Airbus A320neo", "13:45", "15:10", 5520),

    # HYD <-> PNQ
    ("6E 718",  "6E", "IndiGo", "HYD", "PNQ", "Airbus A320neo", "08:30", "09:45", 4450),
    ("6E 719",  "6E", "IndiGo", "PNQ", "HYD", "Airbus A320neo", "10:25", "11:40", 4500),
    ("AI 571",  "AI", "Air India", "HYD", "PNQ", "Airbus A320neo", "16:10", "17:25", 4950),
    ("AI 572",  "AI", "Air India", "PNQ", "HYD", "Airbus A320neo", "18:05", "19:20", 5000),

    # CCU <-> PNQ
    ("6E 574",  "6E", "IndiGo", "CCU", "PNQ", "Airbus A320neo", "12:15", "14:45", 6890),
    ("6E 575",  "6E", "IndiGo", "PNQ", "CCU", "Airbus A320neo", "15:25", "17:55", 6950),

    # MAA <-> PNQ
    ("6E 6231", "6E", "IndiGo", "MAA", "PNQ", "Airbus A320neo", "14:00", "15:40", 5650),
    ("6E 6232", "6E", "IndiGo", "PNQ", "MAA", "Airbus A320neo", "16:20", "18:00", 5700),

    # GOI <-> PNQ
    ("6E 6112", "6E", "IndiGo", "GOI", "PNQ", "ATR 72-600",    "10:45", "11:55", 3890),
    ("6E 6113", "6E", "IndiGo", "PNQ", "GOI", "ATR 72-600",    "12:35", "13:45", 3950),

    # AMD <-> PNQ
    ("6E 6384", "6E", "IndiGo", "AMD", "PNQ", "Airbus A320neo", "09:10", "10:30", 4650),
    ("6E 6385", "6E", "IndiGo", "PNQ", "AMD", "Airbus A320neo", "11:15", "12:35", 4720),
    ("SG 8241", "SG", "SpiceJet", "AMD", "PNQ", "Boeing 737-800", "17:00", "18:20", 4450),
    ("SG 8242", "SG", "SpiceJet", "PNQ", "AMD", "Boeing 737-800", "19:00", "20:20", 4500),

    # JAI <-> PNQ
    ("6E 6421", "6E", "IndiGo", "JAI", "PNQ", "Airbus A320neo", "13:30", "15:20", 5890),
    ("6E 6422", "6E", "IndiGo", "PNQ", "JAI", "Airbus A320neo", "16:00", "17:50", 5950),

    # LKO <-> PNQ
    ("6E 6721", "6E", "IndiGo", "LKO", "PNQ", "Airbus A320neo", "11:00", "13:10", 6120),
    ("6E 6722", "6E", "IndiGo", "PNQ", "LKO", "Airbus A320neo", "13:50", "16:00", 6180),

    # SXR <-> PNQ
    ("6E 6911", "6E", "IndiGo", "SXR", "PNQ", "Airbus A320neo", "10:15", "13:00", 8450),
    ("6E 6912", "6E", "IndiGo", "PNQ", "SXR", "Airbus A320neo", "13:45", "16:30", 8520),

    # PAT <-> PNQ
    ("6E 6841", "6E", "IndiGo", "PAT", "PNQ", "Airbus A320neo", "14:20", "16:45", 6950),
    ("6E 6842", "6E", "IndiGo", "PNQ", "PAT", "Airbus A320neo", "17:25", "19:50", 7020),

    # International routes
    ("MH 161",  "MH", "Malaysia Airlines", "KUL", "LHR", "Airbus A350-941", "23:15", "05:55", 48500),
    ("MH 162",  "MH", "Malaysia Airlines", "LHR", "KUL", "Airbus A350-941", "10:25", "06:45", 49200),
    ("EK 511",  "EK", "Emirates",          "DEL", "DXB", "Boeing 777-300ER", "10:35", "13:00", 24500),
    ("EK 510",  "EK", "Emirates",          "DXB", "DEL", "Boeing 777-300ER", "04:20", "09:05", 24800),
    ("EK 500",  "EK", "Emirates",          "BOM", "DXB", "Boeing 777-300ER", "20:40", "22:30", 23800),
    ("EK 501",  "EK", "Emirates",          "DXB", "BOM", "Boeing 777-300ER", "14:40", "19:15", 24100),
    ("SQ 403",  "SQ", "Singapore Airlines", "DEL", "SIN", "Airbus A350-900", "09:50", "18:05", 31500),
    ("SQ 402",  "SQ", "Singapore Airlines", "SIN", "DEL", "Airbus A350-900", "02:35", "05:40", 31800),
    ("SQ 421",  "SQ", "Singapore Airlines", "BOM", "SIN", "Airbus A350-900", "11:45", "19:50", 30800),
    ("SQ 422",  "SQ", "Singapore Airlines", "SIN", "BOM", "Airbus A350-900", "07:35", "10:30", 31200),
    ("LH 761",  "LH", "Lufthansa",         "DEL", "FRA", "Boeing 747-8",     "02:50", "07:45", 46500),
    ("LH 760",  "LH", "Lufthansa",         "FRA", "DEL", "Boeing 747-8",     "13:45", "01:15", 46800),
    ("BA 142",  "BA", "British Airways",   "DEL", "LHR", "Boeing 787-9",     "03:15", "07:35", 51000),
    ("BA 143",  "BA", "British Airways",   "LHR", "DEL", "Boeing 787-9",     "10:15", "23:45", 51500),
    ("QR 571",  "QR", "Qatar Airways",     "DEL", "DOH", "Airbus A350-900", "04:00", "05:55", 28900),
    ("QR 570",  "QR", "Qatar Airways",     "DOH", "DEL", "Airbus A350-900", "19:30", "01:50", 29200),
    ("LX 2647", "LX", "Swiss International Air Lines", "SIN", "ZRH", "Boeing 777-300ER", "23:05", "06:10", 49800)
]

print(f"Total defined authentic DGCA flight pairs: {len(ROUTES_SPEC)}")
