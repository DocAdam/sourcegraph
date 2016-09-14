package testutil

import (
	"net/url"
	"time"

	"context"

	"sourcegraph.com/sourcegraph/sourcegraph/pkg/auth"
)

// AddSystemAuthToURL adds credentials to urlStr (which is assumed to
// be an HTTP(S) URL) that authenticate requests as the system (i.e.,
// not as any particular user).
func AddSystemAuthToURL(ctx context.Context, scope, urlStr string) (string, error) {
	tok, err := auth.NewAccessToken(&auth.Actor{
		Scope: map[string]bool{scope: true},
	}, nil, 3*time.Hour)
	if err != nil {
		return "", err
	}

	u, err := url.Parse(urlStr)
	if err != nil {
		return "", err
	}
	u.User = url.UserPassword("x-oauth-basic", string(tok))
	return u.String(), nil
}
