import CategoryCard from "./CategoryCard";
import { categoriesTemplate } from "@/utils/constant";

const Prompt = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30" id="templates">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              Create motion graphics from a prompt
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              Describe your vision and let our AI generate stunning motion
              graphics. Customize or export instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categoriesTemplate.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Prompt;
