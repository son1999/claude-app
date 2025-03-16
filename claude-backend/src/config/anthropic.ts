import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('ANTHROPIC_API_KEY không được cấu hình trong file .env');
  process.exit(1);
}

// Khởi tạo SDK Anthropic với API key
const anthropic = new Anthropic({
  apiKey
});

export default anthropic; 