"""Seed data for Israeli holidays (2026-2027).

Dates are based on the Hebrew calendar converted to Gregorian dates and may be
off by a day for minor/observance days depending on the source used. They
should be reviewed and extended with future years periodically (e.g. once a
year) since Hebrew-calendar holidays shift on the Gregorian calendar.
"""

from datetime import date

from sqlalchemy.orm import Session

from app.models import Holiday

HOLIDAYS = [
    # (date, name_he, name_en, name_ru, is_major)
    (date(2026, 2, 2), "ט\"ו בשבט", "Tu BiShvat", "Ту би-Шват", False),
    (date(2026, 3, 3), "פורים", "Purim", "Пурим", False),
    (date(2026, 4, 2), "פסח", "Passover (1st day)", "Песах (1-й день)", True),
    (date(2026, 4, 8), "שביעי של פסח", "Passover (7th day)", "Песах (7-й день)", True),
    (date(2026, 4, 14), "יום השואה", "Holocaust Remembrance Day", "День памяти жертв Холокоста", False),
    (date(2026, 4, 21), "יום הזיכרון", "Memorial Day", "День памяти павших", False),
    (date(2026, 4, 22), "יום העצמאות", "Independence Day", "День независимости Израиля", True),
    (date(2026, 5, 5), "ל\"ג בעומר", "Lag BaOmer", "Лаг ба-Омер", False),
    (date(2026, 5, 15), "יום ירושלים", "Jerusalem Day", "День Иерусалима", False),
    (date(2026, 5, 22), "שבועות", "Shavuot", "Шавуот", True),
    (date(2026, 9, 12), "ראש השנה", "Rosh Hashanah", "Рош ха-Шана", True),
    (date(2026, 9, 21), "יום כיפור", "Yom Kippur", "Йом-Кипур", True),
    (date(2026, 9, 26), "סוכות", "Sukkot", "Суккот", True),
    (date(2026, 10, 3), "שמחת תורה", "Simchat Torah", "Симхат-Тора", True),
    (date(2026, 12, 5), "חנוכה", "Hanukkah", "Ханука", False),
    (date(2027, 1, 22), "ט\"ו בשבט", "Tu BiShvat", "Ту би-Шват", False),
    (date(2027, 3, 23), "פורים", "Purim", "Пурим", False),
    (date(2027, 4, 22), "פסח", "Passover (1st day)", "Песах (1-й день)", True),
    (date(2027, 4, 28), "שביעי של פסח", "Passover (7th day)", "Песах (7-й день)", True),
    (date(2027, 5, 4), "יום השואה", "Holocaust Remembrance Day", "День памяти жертв Холокоста", False),
    (date(2027, 5, 11), "יום הזיכרון", "Memorial Day", "День памяти павших", False),
    (date(2027, 5, 12), "יום העצמאות", "Independence Day", "День независимости Израиля", True),
    (date(2027, 5, 25), "ל\"ג בעומר", "Lag BaOmer", "Лаг ба-Омер", False),
    (date(2027, 6, 3), "יום ירושלים", "Jerusalem Day", "День Иерусалима", False),
    (date(2027, 6, 11), "שבועות", "Shavuot", "Шавуот", True),
    (date(2027, 10, 2), "ראש השנה", "Rosh Hashanah", "Рош ха-Шана", True),
    (date(2027, 10, 11), "יום כיפור", "Yom Kippur", "Йом-Кипур", True),
    (date(2027, 10, 16), "סוכות", "Sukkot", "Суккот", True),
    (date(2027, 10, 23), "שמחת תורה", "Simchat Torah", "Симхат-Тора", True),
    (date(2027, 12, 25), "חנוכה", "Hanukkah", "Ханука", False),
]


def seed_holidays(db: Session) -> None:
    if db.query(Holiday).first() is not None:
        return
    for holiday_date, name_he, name_en, name_ru, is_major in HOLIDAYS:
        db.add(
            Holiday(
                date=holiday_date,
                name_he=name_he,
                name_en=name_en,
                name_ru=name_ru,
                is_major=is_major,
            )
        )
    db.commit()
