import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

// In-memory sessions store fallback
const memorySessions = new Map();

/**
 * 1. Register or Update Active Device Session
 * POST /api/auth/session
 */
export async function registerSession(req, res) {
  try {
    const {
      sessionId,
      userId,
      userName,
      userEmail,
      role = "user",
      deviceName,
      platform = "windows",
      ipAddress,
      userAgent,
    } = req.body;

    if (!sessionId || !userName) {
      return errorResponse(res, "sessionId and userName are required", 400);
    }

    const now = new Date().toISOString();
    const id = `sess-${sessionId.slice(-16)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days session

    const sessionObj = {
      id,
      session_id: sessionId,
      user_id: userId || id,
      user_name: userName,
      user_email: userEmail ? userEmail.toLowerCase().trim() : null,
      role: role || "user",
      device_name: deviceName || "Web Terminal",
      platform: platform || "windows",
      ip_address: ipAddress || req.ip || "127.0.0.1",
      user_agent: userAgent || req.headers["user-agent"] || "",
      is_active: true,
      last_active_at: now,
      created_at: now,
      expires_at: expiresAt,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("auth_sessions")
          .upsert(
            {
              id: sessionObj.id,
              session_id: sessionObj.session_id,
              user_id: sessionObj.user_id,
              user_name: sessionObj.user_name,
              user_email: sessionObj.user_email,
              role: sessionObj.role,
              device_name: sessionObj.device_name,
              platform: sessionObj.platform,
              ip_address: sessionObj.ip_address,
              user_agent: sessionObj.user_agent,
              is_active: true,
              last_active_at: now,
              expires_at: expiresAt,
            },
            { onConflict: "session_id" }
          )
          .select()
          .single();

        if (!error && data) {
          return successResponse(res, { session: data }, "Session registered successfully");
        }
      } catch (err) {
        console.warn("Supabase auth_sessions upsert note, using memory store:", err.message);
      }
    }

    // Memory store fallback
    memorySessions.set(sessionId, sessionObj);
    return successResponse(res, { session: sessionObj }, "Session registered successfully (memory)");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * 2. Get All Active Authorized Sessions
 * GET /api/auth/sessions
 */
export async function getActiveSessions(req, res) {
  try {
    let activeSessions = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("auth_sessions")
          .select("*")
          .eq("is_active", true)
          .order("last_active_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          activeSessions = data;
        }
      } catch (err) {
        console.warn("Supabase auth_sessions fetch note:", err.message);
      }
    }

    // Merge in-memory active sessions if Supabase returned empty or is offline
    if (activeSessions.length === 0 && memorySessions.size > 0) {
      activeSessions = Array.from(memorySessions.values()).filter((s) => s.is_active);
    }

    const formattedDevices = activeSessions.map((s) => {
      const lastActiveDate = new Date(s.last_active_at || s.created_at);
      const diffMinutes = Math.floor((Date.now() - lastActiveDate.getTime()) / (60 * 1000));
      let lastActiveStr = "Active now";
      if (diffMinutes > 0 && diffMinutes < 60) {
        lastActiveStr = `${diffMinutes} min${diffMinutes > 1 ? "s" : ""} ago`;
      } else if (diffMinutes >= 60 && diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        lastActiveStr = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else if (diffMinutes >= 1440) {
        const days = Math.floor(diffMinutes / 1440);
        lastActiveStr = `${days} day${days > 1 ? "s" : ""} ago`;
      }

      return {
        id: s.id || s.session_id,
        uuid: s.session_id,
        name: s.device_name || "Showroom Terminal",
        userName: s.user_name,
        userEmail: s.user_email,
        role: s.role,
        platform: (s.platform || "windows").toLowerCase(),
        lastActive: lastActiveStr,
        lastActiveAt: s.last_active_at,
        isCurrentDevice: false,
        ipAddress: s.ip_address || "127.0.0.1",
        createdAt: s.created_at,
      };
    });

    return successResponse(res, { devices: formattedDevices, count: formattedDevices.length }, "Active authorized sessions loaded");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * 3. Revoke Authorized Session
 * DELETE /api/auth/sessions/:sessionId
 */
export async function revokeSession(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return errorResponse(res, "Session ID is required", 400);
    }

    if (supabase) {
      try {
        await supabase
          .from("auth_sessions")
          .update({ is_active: false, last_active_at: new Date().toISOString() })
          .or(`id.eq.${sessionId},session_id.eq.${sessionId}`);
      } catch (err) {
        console.warn("Supabase revoke session note:", err.message);
      }
    }

    // Update in memory store
    for (const [key, val] of memorySessions.entries()) {
      if (val.id === sessionId || val.session_id === sessionId) {
        val.is_active = false;
        memorySessions.set(key, val);
      }
    }

    return successResponse(res, { revokedId: sessionId }, "Session access revoked successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * 4. User Logout
 * POST /api/auth/logout
 */
export async function logoutSession(req, res) {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      if (supabase) {
        try {
          await supabase
            .from("auth_sessions")
            .update({ is_active: false })
            .or(`id.eq.${sessionId},session_id.eq.${sessionId}`);
        } catch {}
      }
      if (memorySessions.has(sessionId)) {
        const s = memorySessions.get(sessionId);
        s.is_active = false;
      }
    }
    return successResponse(res, null, "Logged out successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

/**
 * 5. Initiate Google OAuth 2.0 Flow
 * GET /api/auth/google
 */
export async function initiateGoogleAuth(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/auth/google/callback`;
    const clientRedirect = req.query.redirect || "/shop";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (!clientId) {
      console.warn("[GoogleAuth] GOOGLE_CLIENT_ID not configured in backend/.env.");
      return res.redirect(
        `${clientUrl}/auth/callback?error=${encodeURIComponent(
          "Google OAuth 2.0 is not configured on the backend. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env."
        )}&redirect=${encodeURIComponent(clientRedirect)}`
      );
    }

    const statePayload = Buffer.from(
      JSON.stringify({
        redirect: clientRedirect,
        ts: Date.now(),
      })
    ).toString("base64url");

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent select_account",
        state: statePayload,
      }).toString();

    return res.redirect(googleAuthUrl);
  } catch (err) {
    console.error("[GoogleAuth] Error initiating OAuth:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * 6. Handle Google OAuth 2.0 Callback
 * GET /api/auth/google/callback
 */
export async function handleGoogleCallback(req, res) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const { code, state, error: oauthError } = req.query;

    let destination = "/shop";
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(String(state), "base64url").toString("utf-8"));
        if (decodedState?.redirect) destination = decodedState.redirect;
      } catch {}
    }

    if (oauthError) {
      return res.redirect(
        `${clientUrl}/auth/callback?error=${encodeURIComponent(
          `Google Authorization Error: ${oauthError}`
        )}&redirect=${encodeURIComponent(destination)}`
      );
    }

    if (!code) {
      return res.redirect(
        `${clientUrl}/auth/callback?error=${encodeURIComponent(
          "Authorization code missing from Google response"
        )}&redirect=${encodeURIComponent(destination)}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/auth/google/callback`;

    // 1. Exchange Code for Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: String(clientId || ""),
        client_secret: String(clientSecret || ""),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(
        tokenData.error_description || tokenData.error || "Failed to exchange token with Google"
      );
    }

    // 2. Fetch User Profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error("Failed to retrieve Google user profile");
    }

    const googleProfile = await userRes.json();
    const { id: googleId, email, name, picture } = googleProfile;

    if (!email) {
      throw new Error("No verified email received from Google");
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || "Google Patron";
    const patronId = `user-g-${(googleId || Date.now().toString(36)).slice(-12)}`;
    const now = new Date().toISOString();

    // 3. Upsert Patron in Database / Supabase
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from("customers")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("customers")
            .update({
              name: existing.name || displayName,
              notes: existing.notes ? `${existing.notes} | Google Auth Linked` : "Registered via Google Auth",
              updated_at: now,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("customers").insert([
            {
              id: patronId,
              name: displayName,
              email: cleanEmail,
              phone: `G-${(googleId || "").slice(-8)}`,
              city: "Hyderabad",
              notes: "Registered via Google Auth",
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      } catch (dbErr) {
        console.warn("[GoogleAuth] DB upsert note:", dbErr.message);
      }
    }

    const userPayload = {
      id: patronId,
      name: displayName,
      email: cleanEmail,
      phone: "",
      role: "user",
      authProvider: "google",
      avatarUrl: picture || undefined,
      loggedInAt: now,
      lastActiveAt: now,
      status: "active",
    };

    const userParam = encodeURIComponent(JSON.stringify(userPayload));
    return res.redirect(
      `${clientUrl}/auth/callback?success=true&user=${userParam}&redirect=${encodeURIComponent(destination)}`
    );
  } catch (err) {
    console.error("[GoogleAuth] Callback error:", err);
    return res.redirect(
      `${clientUrl}/auth/callback?error=${encodeURIComponent(
        err.message || "Google authentication failed"
      )}`
    );
  }
}

/**
 * 7. Direct Google Credential / One-Tap Verification
 * POST /api/auth/google/verify
 */
export async function verifyGoogleToken(req, res) {
  try {
    const { credential, accessToken, redirect = "/shop" } = req.body;

    if (!credential && !accessToken) {
      return errorResponse(res, "Google credential or access token is required", 400);
    }

    let profile = null;

    if (credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      const tokenInfo = await verifyRes.json();
      if (!verifyRes.ok || tokenInfo.error) {
        return errorResponse(res, tokenInfo.error_description || "Invalid Google ID token", 401);
      }
      profile = {
        id: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name,
        picture: tokenInfo.picture,
      };
    } else if (accessToken) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        return errorResponse(res, "Failed to verify Google access token", 401);
      }
      profile = await userRes.json();
    }

    if (!profile || !profile.email) {
      return errorResponse(res, "Failed to retrieve user profile from Google", 400);
    }

    const cleanEmail = profile.email.toLowerCase().trim();
    const displayName = profile.name || "Google Patron";
    const patronId = `user-g-${(profile.id || Date.now().toString(36)).slice(-12)}`;
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from("customers")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("customers")
            .update({
              name: existing.name || displayName,
              updated_at: now,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("customers").insert([
            {
              id: patronId,
              name: displayName,
              email: cleanEmail,
              phone: `G-${(profile.id || "").slice(-8)}`,
              city: "Hyderabad",
              notes: "Registered via Google Auth",
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      } catch (dbErr) {
        console.warn("[GoogleAuth] DB upsert note:", dbErr.message);
      }
    }

    const userPayload = {
      id: patronId,
      name: displayName,
      email: cleanEmail,
      phone: "",
      role: "user",
      authProvider: "google",
      avatarUrl: profile.picture || undefined,
      loggedInAt: now,
      lastActiveAt: now,
      status: "active",
    };

    return successResponse(
      res,
      { user: userPayload, redirect },
      "Google sign-in verified successfully"
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
