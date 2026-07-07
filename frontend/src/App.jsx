import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tiktokTrending, setTiktokTrending] = useState([]);
  const [twitterTrending, setTwitterTrending] = useState([]);
  const [redditTrending, setRedditTrending] = useState([]);
  const [allTrending, setAllTrending] = useState([]);
  const [coins, setCoins] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoMonitoring, setAutoMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const API_URL = 'http://localhost:5000/api';

  // Fetch all platforms
  const fetchAllTrending = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/trending`);
      const data = await response.json();
      setAllTrending(data.memes || []);
    } catch (error) {
      console.error('Error fetching all trending:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch TikTok only
  const fetchTiktokTrending = async () => {
    try {
      const response = await fetch(`${API_URL}/tiktok/trending`);
      const data = await response.json();
      setTiktokTrending(data.memes || []);
    } catch (error) {
      console.error('Error fetching TikTok:', error);
    }
  };

  // Fetch Twitter only
  const fetchTwitterTrending = async () => {
    try {
      const response = await fetch(`${API_URL}/twitter/trending`);
      const data = await response.json();
      setTwitterTrending(data.memes || []);
    } catch (error) {
      console.error('Error fetching Twitter:', error);
    }
  };

  // Fetch Reddit only
  const fetchRedditTrending = async () => {
    try {
      const response = await fetch(`${API_URL}/reddit/trending`);
      const data = await response.json();
      setRedditTrending(data.memes || []);
    } catch (error) {
      console.error('Error fetching Reddit:', error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    await Promise.all([
      fetchAllTrending(),
      fetchTiktokTrending(),
      fetchTwitterTrending(),
      fetchRedditTrending(),
      fetchCoins(),
      fetchDashboard(),
    ]);
  };

  // Fetch launched coins
  const fetchCoins = async () => {
    try {
      const response = await fetch(`${API_URL}/coins`);
      const data = await response.json();
      setCoins(data.coins || []);
    } catch (error) {
      console.error('Error fetching coins:', error);
    }
  };

  // Fetch dashboard stats
  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  // Launch memecoin
  const launchCoin = async (meme, platform = 'all') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: meme.keyword || meme.name,
          viralityScore: meme.viralityScore || meme.weightedScore,
          platform: platform,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Coin launched: ${data.name}`);
        fetchAllData();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error launching coin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start monitoring
  const startMonitoring = async () => {
    try {
      const response = await fetch(`${API_URL}/start-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: 300 }),
      });
      const data = await response.json();
      if (data.success) {
        setAutoMonitoring(true);
        alert('🚀 Auto-monitoring started! Coins will launch automatically!');
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  // Auto-launch top memes
  const autoLaunchTop = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auto-launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Auto-launched ${data.launchedCount} coins!`);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error auto-launching:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'tiktok':
        return '#FF0050';
      case 'twitter':
        return '#1DA1F2';
      case 'reddit':
        return '#FF4500';
      default:
        return '#4ecdc4';
    }
  };

  const renderMemeCard = (meme, platform = 'all') => (
    <div key={meme.id || Math.random()} className="meme-card">
      <div className="meme-header">
        <h3>{meme.keyword || meme.name || 'Untitled'}</h3>
        {meme.sources && (
          <div className="sources">
            {meme.sources.map(src => (
              <span key={src} className="source" style={{ backgroundColor: getPlatformColor(src) }}>
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
      <p>📊 Score: {(meme.viralityScore || meme.weightedScore || 0).toLocaleString()}</p>
      {meme.views && <p>👁️ Views: {meme.views.toLocaleString()}</p>}
      {meme.engagement && <p>💬 Engagement: {meme.engagement.toLocaleString()}</p>}
      <button
        onClick={() => launchCoin(meme, platform)}
        disabled={loading}
        className="launch-btn"
      >
        🚀 Launch Coin
      </button>
    </div>
  );

  return (
    <div className="App">
      <header className="header">
        <h1>🪙 Multi-Platform Memecoin Bot</h1>
        <p>⚖️ BALANCED: 🔴 TikTok (1.5x) = 🔵 Twitter (1.5x) >> 🟠 Reddit (1x)</p>
      </header>

      <div className="container">
        {/* Dashboard */}
        {dashboard && (
          <div className="dashboard">
            <h2>📊 Dashboard</h2>
            <div className="stats">
              <div className="stat">
                <h3>{dashboard.totalCoinsLaunched}</h3>
                <p>Coins Launched</p>
              </div>
              <div className="stat">
                <h3>◎ {dashboard.totalEarnings}</h3>
                <p>Earnings (SOL)</p>
              </div>
              <div className="stat">
                <h3>${dashboard.totalEarningsUSD}</h3>
                <p>Total USD</p>
              </div>
              <div className="stat">
                <h3>{dashboard.averageViralityScore}</h3>
                <p>Avg Virality</p>
              </div>
            </div>
            {dashboard.platformBreakdown && (
              <div className="platform-breakdown">
                <h4>🎯 Coins by Platform (Balanced Priority):</h4>
                <p>🔴 TikTok: {dashboard.platformBreakdown.tiktok}</p>
                <p>🔵 Twitter: {dashboard.platformBreakdown.twitter}</p>
                <p>🟠 Reddit: {dashboard.platformBreakdown.reddit}</p>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="controls">
          <button onClick={fetchAllData} disabled={loading}>
            🔄 Refresh
          </button>
          <button
            onClick={autoLaunchTop}
            disabled={loading}
            className="launch-btn"
          >
            🚀 Auto-Launch Top 5
          </button>
          <button
            onClick={startMonitoring}
            disabled={autoMonitoring}
            className={autoMonitoring ? 'monitoring' : ''}
          >
            {autoMonitoring ? '🟢 Monitoring Active' : 'Start Continuous Monitoring'}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            🌐 All Platforms
          </button>
          <button
            className={activeTab === 'tiktok' ? 'active' : ''}
            onClick={() => setActiveTab('tiktok')}
          >
            🔴 TikTok (1.5x)
          </button>
          <button
            className={activeTab === 'twitter' ? 'active' : ''}
            onClick={() => setActiveTab('twitter')}
          >
            🔵 Twitter (1.5x)
          </button>
          <button
            className={activeTab === 'reddit' ? 'active' : ''}
            onClick={() => setActiveTab('reddit')}
          >
            🟠 Reddit (1x)
          </button>
        </div>

        {/* Trending Memes */}
        <div className="section">
          <h2>
            {activeTab === 'all' && '🌐 All Trending Memes (Balanced Priority)'}
            {activeTab === 'tiktok' && '🔴 TikTok Trending (1.5x Priority - Viral Spread)'}
            {activeTab === 'twitter' && '🔵 Twitter Trending (1.5x Priority - Crypto Buyers)'}
            {activeTab === 'reddit' && '🟠 Reddit Trending (1x Validation)'}
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="meme-grid">
              {activeTab === 'all' &&
                allTrending.map(meme => renderMemeCard(meme, 'all'))}
              {activeTab === 'tiktok' &&
                tiktokTrending.map(meme => renderMemeCard(meme, 'tiktok'))}
              {activeTab === 'twitter' &&
                twitterTrending.map(meme => renderMemeCard(meme, 'twitter'))}
              {activeTab === 'reddit' &&
                redditTrending.map(meme => renderMemeCard(meme, 'reddit'))}
            </div>
          )}
        </div>

        {/* Launched Coins */}
        <div className="section">
          <h2>💰 Launched Coins ({coins.length})</h2>
          {coins.length > 0 ? (
            <div className="coins-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Sources</th>
                    <th>Score</th>
                    <th>Launch Time</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, idx) => (
                    <tr key={idx}>
                      <td>{coin.name}</td>
                      <td>{coin.symbol}</td>
                      <td>{(coin.sources || []).join(', ')}</td>
                      <td>{coin.viralityScore || 'N/A'}</td>
                      <td>{new Date(coin.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No coins launched yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
