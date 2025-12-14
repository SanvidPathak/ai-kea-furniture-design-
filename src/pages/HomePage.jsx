import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { GlassPanel } from '../components/common/GlassPanel.jsx';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <section className="section-container px-4 pt-16 sm:pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight leading-tight"
          >
            Design Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-ikea-blue to-ikea-electric">Perfect Furniture</span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-300 mb-8 sm:mb-12 font-light"
          >
            AI-powered modular furniture design platform where imagination meets engineering.
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed"
          >
            Simply describe what you need in plain English, or use our guided design tool.
            Get instant cost estimates, assembly instructions, and Z-axis depth previews.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16 sm:mb-24">
            {isAuthenticated ? (
              <>
                <Link to="/create" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-ikea-blue/20">
                    Start Designing →
                  </Button>
                </Link>
                <Link to="/designs" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto text-lg px-8 py-4">
                    My Designs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-ikea-blue/20">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="text-lg px-8 py-4">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6 mb-20"
          >
            <GlassPanel className="text-left hover:-translate-y-2 transition-transform duration-300">
              <div className="text-5xl mb-6 bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center">🤖</div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">AI-Powered</h3>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Describe your furniture in plain English. Our advanced AI understands context, style, and engineering constraints.
              </p>
            </GlassPanel>
            <GlassPanel className="text-left hover:-translate-y-2 transition-transform duration-300">
              <div className="text-5xl mb-6 bg-yellow-50 w-16 h-16 rounded-2xl flex items-center justify-center">🛠️</div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Modular Design</h3>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Every piece breaks down into standard parts with clear, auto-generated assembly instructions.
              </p>
            </GlassPanel>
            <GlassPanel className="text-left hover:-translate-y-2 transition-transform duration-300">
              <div className="text-5xl mb-6 bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center">💰</div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Cost Transparent</h3>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Real-time pricing based on material volume and current market rates. No hidden fees.
              </p>
            </GlassPanel>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
