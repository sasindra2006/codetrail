import { ProblemList } from "./problem-list";

export default async function ProblemsPage({ searchParams }: PageProps<"/problems">) {
  const params = await searchParams;
  const initialSearch = Array.isArray(params.search) ? params.search[0] ?? "" : params.search ?? "";
  return <ProblemList initialSearch={initialSearch} key={initialSearch} />;
}
