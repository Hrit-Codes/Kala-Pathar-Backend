const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
});

redisClient.on('connect', async () => {
    console.log('✅ Connected to Redis');
    
    try {
        // ⚠️ DANGEROUS - This will delete ALL Redis data!
        console.log('⚠️  WARNING: This will delete ALL Redis data!');
        console.log('📌 Press Ctrl+C within 5 seconds to cancel...');
        
        // Wait 5 seconds to allow cancellation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🗑️  Clearing ALL Redis data...');
        
        // Method 1: Flush all data in current database
        await redisClient.flushdb();
        console.log('✅ All data in current database cleared!');
        
        // Method 2: Flush all data in ALL databases (uncomment if needed)
        // await redisClient.flushall();
        // console.log('✅ All data in ALL databases cleared!');
        
        // Verify everything is cleared
        const keys = await redisClient.keys('*');
        if (keys.length === 0) {
            console.log('✅ Redis is now completely empty!');
        } else {
            console.log(`⚠️  Remaining keys: ${keys.length}`);
            console.log('   Keys:', keys);
        }
        
        console.log('✨ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing Redis:', error.message);
        process.exit(1);
    }
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    console.log('💡 Make sure Redis is running!');
    process.exit(1);
});