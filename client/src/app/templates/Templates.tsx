"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import TemplateCard from "@/components/Overlay/TemplateCard";
import SearchBar from "@/components/Templates/SearchBar";
import { templates } from "@/utils/constant";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";

function filterTemplatesBySearch(
  items: typeof templates,
  query: string
): typeof templates {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((template) => {
    const nameMatch = template.name.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = (template.description ?? "")
      .toLowerCase()
      .includes(normalizedQuery);
    return nameMatch || descriptionMatch;
  });
}

const Templates = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? ""
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    () => searchParams.get("q") ?? ""
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visibleCount, setVisibleCount] = useState(8);
  const scrollTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    const nextQuery = debouncedSearchQuery.trim();

    if (currentQuery === nextQuery) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    router.replace(
      queryString ? `/templates?${queryString}` : "/templates",
      { scroll: false }
    );
  }, [debouncedSearchQuery, router, searchParams]);

  const filteredTemplates = useMemo(() => {
    // Category filter can be applied here before search when tabs are enabled.
    return filterTemplatesBySearch(templates, debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Reset visible count on search query change to keep initial view minimal
  useEffect(() => {
    setVisibleCount(8);
  }, [debouncedSearchQuery]);

  // Infinite scroll intersection observer logic
  useEffect(() => {
    const trigger = scrollTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 8, filteredTemplates.length));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(trigger);
    return () => {
      observer.unobserve(trigger);
    };
  }, [filteredTemplates.length, visibleCount]);

  const visibleTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  const isSearchActive = debouncedSearchQuery.trim().length > 0;
  const hasNoResults = isSearchActive && filteredTemplates.length === 0;

  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Templates
            </h1>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="mx-auto max-w-lg"
          />

          {hasNoResults ? (
            <div className="flex flex-col items-center justify-center py-9 text-center">
              <Search
                className="mb-2 h-10 w-10 text-muted-foreground"
                aria-hidden
              />
              <h2 className="text-lg font-semibold">No templates found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different keyword or browse all templates
              </p>
          
              <EdikitButton
              onClick={() => setSearchQuery("")}
              variant="secondary"
              className="mt-2"
              >
                Clear search  
              </EdikitButton>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3.5 gap-y-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {visibleTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {visibleCount < filteredTemplates.length && (
                <div ref={scrollTriggerRef} className="h-10 w-full flex items-center justify-center py-4" />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Templates;
