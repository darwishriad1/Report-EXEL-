import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for AI leave parsing
  app.post("/api/ai/parse-leaves", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "الرجاء إرسال نص صالح للمعالجة" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "مفتاح API الخاص بـ Gemini غير مهيأ في إعدادات النظام" });
      }

      const prompt = `أنت مساعد إداري عسكري خبير في لواء العمالقة 43. مهمتك هي تحليل النص التالي واستخراج جميع بيانات الإجازات الطبية والمرضية لمنتسبي اللواء منه بشكل دقيق ومحكم في مصفوفة JSON متوافقة مع البنية المطلوبة.

البيانات الإلزامية لكل منتسب:
- الاسم (الاسم الثلاثي أو الكامل)
- الرتبة (مثل: جندي، عريف، رقيب، رقيب أول، ملازم، ملازم أول، نقيب، رائد، إلخ. إذا لم تذكر افترض 'جندي')
- الوحدة العسكرية (مثل: الكتيبة الأولى، سرية الدعم، سرية الإشارة، الكتيبة الثانية إلخ. القيمة الافتراضية إذا لم تذكر هي: 'اللواء 43 عمالقة')
- نوع الإجازة: يجب تصنيفه بدقة إلى واحد من القيم الأربعة التالية فقط:
  1. 'مريض' (للمرض الشخصي)
  2. 'مرافق' (لمرافقة مريض آخر في المستشفى)
  3. 'مرض قريب' (لمرض أحد الأقارب والاضطرار للجلوس معه)
  4. 'حادث' (لحوادث السير، السقوط، الإصابات الميدانية)
- التشخيص الطبي (التفصيل الصحي أو تشخيص المرض بدقة، مثلاً: 'كسر مضاعف في الساق'، 'التهاب الكبد الوبائي الفيروسي'، 'حمى الضنك')
- الجهة المصدرة (المستشفى أو الطبيب أو اللجنة الطبية التي منحت الإجازة، مثلاً: 'مستشفى الجمهورية عدن'، 'العيادة الميدانية بالخوخة'، إلخ. إذا لم تذكر اكتب 'العيادة الميدانية')
- تاريخ البدء وتاريخ الانتهاء: يجب استخراجهما وتنسيقهما بصيغة YYYY-MM-DD. انتبه: إذا لم يتم ذكر السنة صراحة وكان الشهر يشير إلى يوليو 2026 أو قريباً منه، فافترض أن السنة هي 2026.
- ملاحظات: أي تفاصيل إضافية هامة تذكر في النص.

النص المُراد تحليله:
"""
${text}
"""`;

      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting AI Parse using model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "أنت خبير بيانات عسكري ذكي تقوم باستخراج سجلات إجازات الجنود بدقة تامة من النصوص غير المرتبة وتصنيفها بدقة مطلقة.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  leaves: {
                    type: Type.ARRAY,
                    description: "مصفوفة من الإجازات المستخرجة",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "اسم المنتسب كاملاً" },
                        rank: { type: Type.STRING, description: "رتبة المنتسب (مثلاً: جندي، عريف، رقيب، ملازم)" },
                        unit: { type: Type.STRING, description: "الوحدة أو الكتيبة أو السرية التابع لها" },
                        type: { type: Type.STRING, description: "نوع الإجازة: 'مريض' أو 'مرافق' أو 'مرض قريب' أو 'حادث'" },
                        diagnosis: { type: Type.STRING, description: "التشخيص الطبي للحالة" },
                        issuer: { type: Type.STRING, description: "الجهة المصدرة للتقرير أو الإجازة" },
                        startDate: { type: Type.STRING, description: "تاريخ البدء بصيغة YYYY-MM-DD" },
                        endDate: { type: Type.STRING, description: "تاريخ الانتهاء بصيغة YYYY-MM-DD" },
                        notes: { type: Type.STRING, description: "ملاحظات إضافية مستخرجة" }
                      },
                      required: ["name", "rank", "unit", "type", "diagnosis", "issuer", "startDate", "endDate"]
                    }
                  }
                },
                required: ["leaves"]
              }
            }
          });
          if (response) {
            console.log(`AI Parse Succeeded with model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed/busy. Error:`, err.message || err);
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error("جميع محركات الذكاء الاصطناعي مشغولة حالياً، يرجى المحاولة لاحقاً");
      }

      const resultText = response.text || "{\"leaves\": []}";
      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("AI Parse Error:", error);
      res.status(500).json({ error: error.message || "فشلت عملية التحليل بالذكاء الاصطناعي" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
