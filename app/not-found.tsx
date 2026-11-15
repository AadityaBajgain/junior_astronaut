import Link from "next/link";

export default function NotFound() {
  return (
    <main className="oops">
      <h1>Lost in space</h1>
      <p>That page is not on the mission map.</p>
      <Link className="primary" href="/">
        Back to the mission map
      </Link>
    </main>
  );
}
