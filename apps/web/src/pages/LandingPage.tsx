/**
 * Landing Page
 * ============
 * 
 * Public homepage with hero, features, and CTA sections.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  TruckIcon,
  GiftIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui';

const features = [
  {
    name: 'AI-Powered Classification',
    description:
      'Upload a photo of any waste item and our AI instantly identifies it and tells you exactly which bin it goes in.',
    icon: SparklesIcon,
  },
  {
    name: 'Smart Pickup Scheduling',
    description:
      'Schedule pickups at your convenience. Track drivers in real-time and get notifications when they arrive.',
    icon: TruckIcon,
  },
  {
    name: 'Rewards & Gamification',
    description:
      'Earn points for every correct disposal. Compete on leaderboards and unlock achievements as you help save the planet.',
    icon: GiftIcon,
  },
  {
    name: 'Environmental Impact',
    description:
      'Track your personal environmental impact. See how much CO2 you\'ve saved and trees you\'ve helped plant.',
    icon: ChartBarIcon,
  },
  {
    name: '95%+ Accuracy',
    description:
      'Our multi-stage AI pipeline ensures highly accurate classifications, with manual verification for uncertain items.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Community Driven',
    description:
      'Join thousands of eco-conscious citizens making a difference. Every small action counts towards a cleaner planet.',
    icon: GlobeAltIcon,
  },
];

const stats = [
  { id: 1, name: 'Active Users', value: '50,000+' },
  { id: 2, name: 'Items Classified', value: '1M+' },
  { id: 3, name: 'CO2 Saved (kg)', value: '500K+' },
  { id: 4, name: 'Cities Covered', value: '25+' },
];

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative isolate pt-14">
        {/* Background gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-secondary-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="badge badge-primary mb-4">🌍 Making Earth Greener</span>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Smart Waste Management{' '}
                <span className="text-gradient">Powered by AI</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Snap a photo, get instant classification, earn rewards. Join the movement to make
                waste disposal smarter and more sustainable for everyone.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/dashboard">
                  <Button size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="#how-it-works">
                  <Button variant="ghost" size="lg">
                    Learn More →
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Hero Image/Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="relative rounded-2xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex flex-col items-center gap-8 lg:flex-row">
                    <div className="flex-1">
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 p-8">
                        <div className="flex h-full items-center justify-center">
                          <svg
                            className="h-32 w-32 text-primary-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="rounded-xl bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">Recyclable - Plastic</p>
                            <p className="text-sm text-green-600">95% confidence</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-800">
                          🗑️ Place in Blue Bin
                        </p>
                        <p className="mt-1 text-sm text-blue-600">
                          Rinse before disposing. Remove caps and labels if possible.
                        </p>
                      </div>
                      <div className="rounded-xl bg-yellow-50 p-4">
                        <p className="text-sm font-medium text-yellow-800">
                          🏆 +10 points earned!
                        </p>
                        <p className="mt-1 text-sm text-yellow-600">
                          You're on a 7-day streak! Keep it up!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary-400 to-primary-400 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Trusted by eco-conscious communities worldwide
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Join the growing movement towards smarter waste management
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: stat.id * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col bg-white/5 p-8"
                >
                  <dt className="text-sm font-semibold leading-6 text-gray-300">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">
              Everything you need
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Smarter Waste Management
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform combines cutting-edge AI with gamification to make proper waste disposal
              easy, rewarding, and impactful.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Simple Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  step: 1,
                  title: 'Snap a Photo',
                  description: 'Take a picture of your waste item using your phone',
                  emoji: '📸',
                },
                {
                  step: 2,
                  title: 'Get Classification',
                  description: 'AI instantly identifies the item and tells you the correct bin',
                  emoji: '🤖',
                },
                {
                  step: 3,
                  title: 'Earn Rewards',
                  description: 'Dispose properly and earn points, badges, and more!',
                  emoji: '🏆',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl bg-white p-8 text-center shadow-soft"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-sm font-bold text-white">
                    Step {item.step}
                  </div>
                  <div className="mt-4 text-5xl">{item.emoji}</div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to make a difference?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Join thousands of eco-conscious citizens and start your journey towards smarter waste management today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-primary-50"
                >
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/dashboard" className="text-sm font-semibold leading-6 text-white">
                Start Using Now <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
