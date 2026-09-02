package utils

import "time"

// The platform stores wall-clock times ("what the pro's clock shows") with a
// UTC label — the fake-UTC convention. Anything compared against time.Now()
// must first be converted to the real instant via the pro's IANA timezone.

// LocationOrKyiv resolves an IANA timezone name, falling back to Europe/Kyiv
// (and to a fixed EET offset on systems without a tz database, e.g. Windows).
func LocationOrKyiv(tz string) *time.Location {
	if tz != "" {
		if loc, err := time.LoadLocation(tz); err == nil {
			return loc
		}
	}
	if loc, err := time.LoadLocation("Europe/Kyiv"); err == nil {
		return loc
	}
	return time.FixedZone("EET", 2*60*60)
}

// WallToReal reinterprets a fake-UTC wall-clock value as the real instant in loc.
func WallToReal(wall time.Time, loc *time.Location) time.Time {
	return time.Date(wall.Year(), wall.Month(), wall.Day(),
		wall.Hour(), wall.Minute(), wall.Second(), wall.Nanosecond(), loc)
}

// WallNow returns the current wall-clock time in loc, labeled UTC (fake-UTC),
// ready to compare against stored wall-clock values.
func WallNow(loc *time.Location) time.Time {
	n := time.Now().In(loc)
	return time.Date(n.Year(), n.Month(), n.Day(), n.Hour(), n.Minute(), n.Second(), 0, time.UTC)
}
