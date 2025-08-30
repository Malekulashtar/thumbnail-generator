import 'dotenv/config'
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAI } from "openai";
import { NextResponse } from 'next/server';
import cloudinary from '@/app/lib/cloudinary';
import { GoogleGenAI, Modality } from "@google/genai";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image');
        const formatted_data = {
            placement: formData.get('placement'),
            videoType: formData.get('videoType'),
            style: formData.get('style'),
            mood: formData.get('mood'),
            title: formData.get('title'),
            additionalText: formData.get('additionalText'),
        }
    
        if (!file) {
          return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }
    
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
    
        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'ai-image-generation', // Optional: organize in folders
              public_id: `upload_${Date.now()}`, // Unique filename
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        const generatedImage = await generateImage(formatted_data,uploadResponse.secure_url);
        console.log("generatedImages")
        console.log(generatedImage)
        if(generatedImage?.length && generatedImage.length>1){
          return NextResponse.json({
            success: true,
            original_image: uploadResponse.secure_url,
            thumbnails: generatedImage,
            cloudinary_public_id: uploadResponse.public_id,
          });
        }else{
          return NextResponse.json({
            success: true,
            original_image: uploadResponse.secure_url,
            generated_image: generatedImage[0],
            cloudinary_public_id: uploadResponse.public_id,
          });
        }
    
      } catch (error) {
        console.error('Generation failed:', error);
        return NextResponse.json(
          { error: `Image generation failed ${error}` },
          { status: 500 }
        );
      }
}

async function getResponse(userdata) {

    try {
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small"
          });
        
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: "http://localhost:6333/",
                collectionName: "test-collection",
            }
        )
        const user_query = userdata.messages[userdata.messages.length-1].content;
        console.log(user_query)
        
        const data= await vectorStore.similaritySearch("Who is piyush garg", 3);
        const openai = new OpenAI();
        
        const SYSTEM_PROMPT = `You are a helpful assistant.You answer user queries based on the context provided and do not answer anything outside the context available
        Also provide the source of the answer from the context.
        Context:
        ${JSON.stringify(data)}
        `;
        
        const messagesFormatted = [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            ...userdata.messages
        ];
        console.log(messagesFormatted);
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: messagesFormatted
        });
    
        return response.choices[0].message.content;
    } catch (error) {
        console.error('in getting response from openai error');
        console.log(error);
        
    }
}

async function encodeImageFromUrl(imageUrl) {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the image as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert to Buffer and then to base64
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
      
    } catch (error) {
      console.error("Error encoding image from URL:", error);
      return null;
    }
  }

async function generateImage(formData,imageUrl) {
      const base64Image = await encodeImageFromUrl(imageUrl);

      const final_images = [];

      const formatted_prompt = `You are an expert in creating Youtube Thumbnails.
      The thumbnail should be in the style and size of Youtube Thumbnails (1280 x 720).
      The thumbnail should be a high quality image.
      You will be provided the profile photo of the Youtuber ...you first analyse that photo and perform the necessary actins required to upgrade the photo to place in our thubmnail like backround removal,qualityenhancement,sharpening the photo,etc whatever is required depending on the provided mage
      My preference for the thubmail is as follows:
      Placement of profile photo: ${formData.placement}
      Video Type: ${formData.videoType}
      Style: ${formData.style}
      Mood: ${formData.mood}
      Title of thumbnail: ${formData.title}
      Additional Text for thumbnail: ${formData.additionalText}
      You also understand marketing and business and well aware of the user psychology.So,design the thumnail accordingly such that it is catchy and user friendly.
      Also you can use your creativity to the best to add subtle icons or graphics as well according to my above preferences if it fits in it.`

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });
    
      const prompt = [
        { text: formatted_prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ];

      let generatedImageUrl = null;
    for(let i=0;i<3;i++){
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        config: {
          numberOfImages:3
        },
        contents: prompt,
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            console.log("response data");
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          const generatedImageDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
          const generatedUpload = await cloudinary.uploader.upload(generatedImageDataUri, {
            folder: 'ai-generated',
            public_id: `generated_${Date.now()}`,
          });
          
          generatedImageUrl = generatedUpload.secure_url;
          final_images.push(generatedImageUrl);
          console.log("Generated image URL:", generatedImageUrl);
        }
      }  
        const newImageToPass = await encodeImageFromUrl(generatedImageUrl);
        prompt.push({
          inlineData: {
            mimeType: "image/png",
            data: newImageToPass,
          },
        })
        if(i==0){
          prompt.push({
            text: "This is the thumbnail generated from the initial image,.Can you refine it even more and provide an alternate thumbnail with some variations so that i get choices to pick"
          })
        }
        if(i==1){
          prompt.push({
            text: "This is the thumbnail generated from the initial image and also from a thumbnail from it .Can you refine it even more and provide an alternate thumbnail for youtube shorts as well which size is 1920 x 1080 or 9:16 aspect ratio"
          })
        }
    }
    return final_images;
  }