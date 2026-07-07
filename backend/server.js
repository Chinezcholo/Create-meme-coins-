const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const EventEmitter = require('events');
require('dotenv').config();

const TikTokTracker = require('./tiktok-tracker');
const MemeTracker = require('./meme-tracker');
const PumpFunLauncher = require('./pump-fun-launcher');
const MultiPlatformAggregator = require('./multi-platform-aggregator');

const app = express();
const PORT = process.env.PORT || 5000;

// Global event emitter for real-time events
global.eventEmitter = new EventEmitter();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize services
const tiktokTracker = new TikTokTracker();
const memeTracker = new MemeTracker();
const pumpFunLauncher = new PumpFunLauncher();
const aggregator = new MultiPlatformAggregator();

let launchedCoins = [];
let totalEarnings = 0;
let platformStats = {
  tiktok: 0,
  twitter: 0,
  reddit: 0,
};

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Memecoin Multi-Platform Bot',
    version: '2.0 (Balanced)',
    uptime: process.uptime(),
    coinCount: launchedCoins.length,
    weights: {
      tiktok: '1.5x',
      twitter: '1.5x',
      reddit: '1.0x',
    }
  });
});

/**
 * GET /api/tiktok/trending - TikTok trending memes ONLY
 */
app.get('/api/tiktok/trending', async (req, res) => {
  try {
    const trendingMemes = await tiktokTracker.getAllTrendingMemes();
    res.json({
      success: true,
      platform: 'TikTok',
      count: trendingMemes.length,
      weight: '1.5x (VIRAL SPREAD)',
      memes: trendingMemes.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/twitter/trending - Twitter trending memes
 */
app.get('/api/twitter/trending', async (req, res) => {
  try {
    const trendingMemes = await memeTracker.trackTwitterTrends();
    res.json({
      success: true,
      platform: 'Twitter',
      count: trendingMemes.length,
      weight: '1.5x (CRYPTO BUYERS)',
      memes: trendingMemes.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/reddit/trending - Reddit trending memes
 */
app.get('/api/reddit/trending', async (req, res) => {
  try {
    const trendingMemes = await memeTracker.trackRedditTrends();
    res.json({
      success: true,
      platform: 'Reddit',
      count: trendingMemes.length,
      weight: '1.0x (VALIDATION)',
      memes: trendingMemes.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trending - All platforms aggregated (RECOMMENDED)
 */
app.get('/api/trending', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const topMemes = await aggregator.getTopTrendingMemes(limit);
    const dedupedMemes = aggregator.deduplicateMemes(topMemes);
    
    res.json({
      success: true,
      platform: 'Multi-Platform (Balanced)',
      totalMemes: dedupedMemes.length,
      weighting: {
        tiktok: '1.5x (Viral Spread)',
        twitter: '1.5x (Crypto Buyers)',
        reddit: '1.0x (Validation)',
      },
      strategy: 'BALANCED - TikTok & Twitter equally prioritized',
      memes: dedupedMemes.slice(0, limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/launch - Launch a single memecoin
 */
app.post('/api/launch', async (req, res) => {
  try {
    const { keyword, viralityScore, platform } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword required',
      });
    }

    const memeData = {
      keyword,
      viralityScore: viralityScore || 5000,
      platform: platform || 'manual',
      timestamp: new Date(),
    };

    const result = await pumpFunLauncher.launchMemecoin(memeData);

    if (result.success) {
      launchedCoins.push(result);
      totalEarnings += 0.01;
      if (platform) platformStats[platform.toLowerCase()] = (platformStats[platform.toLowerCase()] || 0) + 1;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auto-launch - Auto-launch top trending memes
 */
app.post('/api/auto-launch', async (req, res) => {
  try {
    const { limit = 5 } = req.body;

    console.log(`🚀 Auto-launching top ${limit} memes...`);

    const results = await aggregator.autoLaunchTopMemes(limit);

    // Update stats
    results.forEach(coin => {
      if (coin.success) {
        launchedCoins.push(coin);
        totalEarnings += 0.01;
        if (coin.sources) {
          coin.sources.forEach(src => {
            platformStats[src.toLowerCase()] = (platformStats[src.toLowerCase()] || 0) + 1;
          });
        }
      }
    });

    res.json({
      success: true,
      launchedCount: results.filter(r => r.success).length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/coins - Get all launched coins
 */
app.get('/api/coins', (req, res) => {
  res.json({
    success: true,
    count: launchedCoins.length,
    coins: launchedCoins,
  });
});

/**
 * GET /api/dashboard - Earnings dashboard with platform breakdown
 */
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    dashboard: {
      totalCoinsLaunched: launchedCoins.length,
      totalEarnings: totalEarnings.toFixed(4),
      totalEarningsUSD: (totalEarnings * 150).toFixed(2),
      platformBreakdown: {
        tiktok: platformStats.tiktok || 0,
        twitter: platformStats.twitter || 0,
        reddit: platformStats.reddit || 0,
      },
      platformWeights: {
        tiktok: '1.5x (Viral Spread)',
        twitter: '1.5x (Crypto Buyers)',
        reddit: '1.0x (Validation)',
      },
      strategy: 'BALANCED PRIORITY - Twitter & TikTok equally important',
      recentCoins: launchedCoins.slice(-5),
      averageViralityScore: launchedCoins.length > 0 
        ? Math.round(
            launchedCoins.reduce((sum, c) => sum + (c.viralityScore || 0), 0) / 
            launchedCoins.length
          )
        : 0,
    },
  });
});

/**
 * POST /api/start-monitoring - Start continuous multi-platform monitoring
 */
app.post('/api/start-monitoring', (req, res) => {
  const interval = req.body.interval || 300; // Default 5 minutes
  
  console.log(`\n🌐 Starting multi-platform continuous monitoring...`);
  console.log(`⏱️  Update interval: ${interval} seconds`);
  console.log(`⚖️  Balanced Platform weights:`);
  console.log(`   🔴 TikTok:  1.5x (Viral Spread)`);
  console.log(`   🔵 Twitter: 1.5x (Crypto Buyers - EQUALLY IMPORTANT)`);
  console.log(`   🟠 Reddit:  1.0x (Validation)\n`);

  const monitoringInterval = aggregator.startContinuousMonitoring(interval);

  res.json({
    success: true,
    message: `Multi-platform monitoring started (${interval}s interval)`,
    platforms: ['TikTok (1.5x)', 'Twitter (1.5x)', 'Reddit (1.0x)'],
    strategy: 'BALANCED - Twitter & TikTok equally prioritized',
  });

  // Optional: Auto-stop after 24 hours
  setTimeout(() => {
    clearInterval(monitoringInterval);
    console.log('⏹️  Monitoring stopped (24-hour limit reached)');
  }, 24 * 60 * 60 * 1000);
});

/**
 * GET /api/stats - Get aggregator statistics
 */
app.get('/api/stats', async (req, res) => {
  const stats = await aggregator.getAggregatorStats();
  res.json({
    success: true,
    stats: {
      ...stats,
      coinsLaunched: launchedCoins.length,
      earningsSOL: totalEarnings.toFixed(4),
      platformStats,
    },
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═════════════════════════════════════════════════════╗
  ║  🪙 MULTI-PLATFORM MEMECOIN PUMP.FUN BOT 🪙       ║
  ║  BALANCED PRIORITY: TikTok & Twitter (1.5x each)   ║
  ║  Server running on port ${PORT}                     ║
  ║  Status: ACTIVE & MONITORING                        ║
  ╚═════════════════════════════════════════════════════╝
  
  ⚖️  BALANCED Platform Weights:
     🔴 TikTok:  1.5x (Viral Spread Fastest)
     🔵 Twitter: 1.5x (Crypto Buyers - IMPORTANT!)
     🟠 Reddit:  1.0x (Community Validation)
  
  💡 Strategy: Catch viral trends on TikTok
             + Reach crypto buyers on Twitter
             + Validate on Reddit
  
  🚀 Ready to launch trending memecoins!
  `);

  // Start meme tracking
  memeTracker.startTracking(300); // Check every 5 minutes

  // Optional: Start auto-monitoring immediately
  // aggregator.startContinuousMonitoring(300);
});

module.exports = app;
