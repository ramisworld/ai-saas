import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { increaseApiLimit, checkApiLimit } from '@/lib/api-limit';
import { checkSubscription } from '@/lib/subscription';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});

export async function POST(req: Request) { 
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { prompt, amount = 1, resolution = "1024x1024" } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!openai.apiKey) {
      return new NextResponse('OpenAI API Key not configured', { status: 500 });
    }

    if (!prompt) {
      return new NextResponse('Prompt is required', { status: 400 });
    }
    if (!amount) {
      return new NextResponse('Amount is required', { status: 400 });
    }

    if (!resolution) {
      return new NextResponse('Resolution is required', { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && (!isPro)) {
      return new NextResponse("Free trial has expired.", { status: 403})
    }

    const imagePromises = Array.from({ length: amount }, async () => {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, // DALL·E 3 only supports 1 per request
        size: resolution,
      });


      
      return response.data[0].url; // Extract image URL
    });

    if (!isPro) {
      await increaseApiLimit();
    }
    
    const images = await Promise.all(imagePromises);
    

    return NextResponse.json(images);
    
   
  } catch (error) {
    console.error('[IMAGE_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
