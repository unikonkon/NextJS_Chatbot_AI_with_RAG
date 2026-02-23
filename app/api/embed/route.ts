// This endpoint is deprecated. Embedding is now done server-side in /api/chat.
export async function POST() {
  return Response.json(
    {
      error: "This endpoint is deprecated. Embedding is handled server-side in /api/chat.",
    },
    { status: 410 }
  );
}
