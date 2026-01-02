import logo from "@/assets/logo.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--accent))_1px,transparent_0)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-3xl border border-primary/20">
            <img
              src={logo}
              alt="Decouverts Plus"
              className="w-48 sm:w-64 h-auto mx-auto"
            />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
          Welcome to{" "}
          <span className="text-primary">Decouverts Plus</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Your trusted partner for premium products, engineering excellence, and innovative manufacturing solutions. 
          We're building something extraordinary for you.
        </p>
      </div>
    </section>
  );
};
