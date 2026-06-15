// Package telegram is a minimal Telegram Bot API client (stdlib only).
// Supports long-polling getUpdates and sendMessage — enough for linking
// accounts and delivering booking notifications.
package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	token string
	http  *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		token: token,
		// Timeout must exceed the long-poll timeout passed to GetUpdates.
		http: &http.Client{Timeout: 65 * time.Second},
	}
}

func (c *Client) api(method string) string {
	return fmt.Sprintf("https://api.telegram.org/bot%s/%s", c.token, method)
}

// --- API response envelopes ---

type apiResponse struct {
	OK          bool            `json:"ok"`
	Description string          `json:"description"`
	Result      json.RawMessage `json:"result"`
}

type Update struct {
	UpdateID int64    `json:"update_id"`
	Message  *Message `json:"message"`
}

type Message struct {
	MessageID int64  `json:"message_id"`
	From      *User  `json:"from"`
	Chat      Chat   `json:"chat"`
	Text      string `json:"text"`
}

type User struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
}

type Chat struct {
	ID int64 `json:"id"`
}

// SendMessage delivers plain text to a chat.
func (c *Client) SendMessage(chatID int64, text string) error {
	payload, _ := json.Marshal(map[string]any{
		"chat_id": chatID,
		"text":    text,
	})
	resp, err := c.http.Post(c.api("sendMessage"), "application/json", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var out apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return err
	}
	if !out.OK {
		return fmt.Errorf("telegram sendMessage: %s", out.Description)
	}
	return nil
}

// GetUpdates long-polls for new updates starting at offset.
// timeout is the server-side long-poll duration in seconds.
func (c *Client) GetUpdates(offset int64, timeout int) ([]Update, error) {
	q := url.Values{}
	q.Set("offset", fmt.Sprintf("%d", offset))
	q.Set("timeout", fmt.Sprintf("%d", timeout))
	q.Set("allowed_updates", `["message"]`)

	resp, err := c.http.Get(c.api("getUpdates") + "?" + q.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if !out.OK {
		return nil, fmt.Errorf("telegram getUpdates: %s", out.Description)
	}

	var updates []Update
	if err := json.Unmarshal(out.Result, &updates); err != nil {
		return nil, err
	}
	return updates, nil
}
