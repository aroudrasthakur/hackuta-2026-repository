type ProfileRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ProfileResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ProfileResponse;
  json: (body: unknown) => void;
};

const HACKATHON_ID = "hackuta-2026";

export default async function handler(req: ProfileRequest, res: ProfileResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const emailHeader = req.headers["x-hackuta-email"];
  const email = Array.isArray(emailHeader) ? emailHeader[0] : emailHeader;
  const convexUrl = process.env.CONVEX_URL;

  if (!email || !convexUrl) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "queries:getRegistrationByEmail",
        args: { email, hackathonId: HACKATHON_ID },
      }),
    });

    const body = await response.json().catch(() => ({ error: "Profile unavailable" }));

    if (!response.ok || body.status === "error") {
      return res.status(response.status === 401 ? 401 : 502).json({ error: "Profile unavailable" });
    }

    return res.status(200).json(body.value ?? body);
  } catch {
    return res.status(502).json({ error: "Profile unavailable" });
  }
}