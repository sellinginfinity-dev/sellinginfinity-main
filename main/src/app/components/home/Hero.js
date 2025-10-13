// FILE: src/app/components/home/Hero.js
'use client';

export default function Hero({ content = {} }) {
  return (
    <section id="home" className="relative section-padding pt-32 pb-20 overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark"></div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10"></div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-100/30 dark:bg-purple-900/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-yellow-100/40 dark:bg-yellow-900/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '60px 60px, 80px 80px',
          backgroundPosition: '0 0, 30px 30px'
        }}></div>
      </div>
      
      <div className="relative content-container container-padding text-center z-10">
        <h1 className="text-hero font-heading mb-6">
          {content.hero?.title || "Generated $20 million in sales."}
        </h1>
        <p className="text-body text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          {content.hero?.content || "Training sales reps to make millions a year. Getting that promotion and new high-paying clients is easy."}
        </p>
        <button className="btn-primary text-button px-10 py-4 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <span className="relative z-10">{content.hero_cta?.title || "FASTEST way to earn freedom NOW"}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    </section>
  );
}
