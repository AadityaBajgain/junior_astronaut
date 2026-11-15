"use client"; // Error boundaries must be Client Components
import Link from "next/link";
import { useEffect } from "react";

export default function GameError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="oops">
      <h1>Houston, a small problem</h1>
      <p>Something went wrong in the game. Your stars are safe.</p>
      <button className="primary" onClick={() => retry()} autoFocus>
        Try again
      </button>
      <Link className="menu-choice" href="/">
        Mission map
      </Link>
    </main>
  );
}
