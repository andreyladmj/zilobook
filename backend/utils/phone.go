package utils

import "strings"

// NormalizePhoneNumber formats any Ukrainian phone number representation into a standard +380... format
func NormalizePhoneNumber(phone string) string {
	// Remove all non-numeric characters
	var clean strings.Builder
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			clean.WriteRune(ch)
		}
	}
	digits := clean.String()

	if len(digits) == 9 {
		// e.g. 997651212 -> +380997651212
		return "+380" + digits
	} else if len(digits) == 10 && strings.HasPrefix(digits, "0") {
		// e.g. 0997651212 -> +380997651212
		return "+380" + digits[1:]
	} else if len(digits) == 11 && strings.HasPrefix(digits, "80") {
		// e.g. 80997651212 -> +380997651212
		return "+380" + digits[2:]
	} else if len(digits) == 12 && strings.HasPrefix(digits, "380") {
		// e.g. 380997651212 -> +380997651212
		return "+" + digits
	} else if len(digits) > 0 {
		// Fallback for length == 12 or prefix 380
		if strings.HasPrefix(digits, "380") {
			return "+" + digits
		}
		if len(digits) == 12 {
			return "+" + digits
		}
	}

	if strings.HasPrefix(phone, "+") {
		return "+" + digits
	}
	return phone
}
