import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  School, Target, Eye, Heart, User, Award, BookOpen,
  Users, GraduationCap, MapPin, Phone, Mail, Globe,
  CheckCircle, Star, Calendar, Sparkles
} from 'lucide-react';
import API from '../api/axios';

// ============================================================
// 🎯 DEFAULT CONTENT (ခင်ဗျား ChatGPT ကနေ ရလာတာ)
// ============================================================
const DEFAULT_CONTENT = {
  history: {
    en: `Maw Goon Thit School (မော်ကွန်းသစ် ကျောင်း) was established to provide accessible, quality education to students from underserved communities who face challenges in accessing learning opportunities due to limited resources. Founded on the belief that every child deserves the opportunity to learn, grow, and build a better future, the school is committed to creating a supportive and inclusive learning environment where students can develop their knowledge, skills, confidence, and potential.

Over the years, Maw Goon Thit School has continued to strengthen its role as a place of learning, personal development, and community support. Under the leadership of Principal Mr. John Alex, the school strives to nurture responsible, compassionate, and capable young people. Beyond academic learning, the school values cooperation among students, parents, teachers, and community members, recognizing that education is a shared responsibility and a powerful foundation for positive change.`,
    mm: `မော်ကွန်းသစ်ကျောင်းကို ပညာရေးအရင်းအမြစ်နှင့် သင်ယူခွင့်အခွင့်အလမ်းများ အကန့်အသတ်ရှိသော လူမှုအသိုင်းအဝိုင်းများမှ ကျောင်းသား၊ ကျောင်းသူများအတွက် အရည်အသွေးရှိသော ပညာရေးကို လက်လှမ်းမီစေရန် ရည်ရွယ်၍ တည်ထောင်ခဲ့သည်။ ကလေးတိုင်းသည် ပညာသင်ယူခွင့်၊ မိမိ၏စွမ်းရည်ကို ဖွံ့ဖြိုးတိုးတက်စေခွင့်နှင့် ပိုမိုကောင်းမွန်သော အနာဂတ်တစ်ခုကို တည်ဆောက်ခွင့်ရှိသည်ဟူသော ယုံကြည်ချက်ကို အခြေခံကာ ကျောင်းသားများ၏ အသိပညာ၊ ကျွမ်းကျင်မှု၊ ကိုယ့်ကိုယ်ကိုယ်ယုံကြည်မှုနှင့် အလားအလာများကို ဖော်ထုတ်ပေးနိုင်မည့် ပံ့ပိုးကူညီမှုရှိသော သင်ယူမှုပတ်ဝန်းကျင်ကို ဖန်တီးရန် ကြိုးပမ်းလျက်ရှိသည်။

နှစ်များတစ်လျှောက် မော်ကွန်းသစ်ကျောင်းသည် ပညာသင်ယူရာနေရာတစ်ခုသာမက ကိုယ်ရည်ကိုယ်သွေးဖွံ့ဖြိုးတိုးတက်ရေးနှင့် လူမှုအသိုင်းအဝိုင်းကို ပံ့ပိုးကူညီရေးအတွက် အရေးပါသော နေရာတစ်ခုဖြစ်လာစေရန် ကြိုးပမ်းခဲ့သည်။ ကျောင်းအုပ်ကြီး ဦးဂျွန်အဲလက်စ်၏ ဦးဆောင်မှုအောက်တွင် တာဝန်သိတတ်သော၊ ကိုယ်ချင်းစာတရားရှိသော၊ စွမ်းရည်ပြည့်ဝသော လူငယ်များ ပေါ်ထွန်းလာစေရန် အလေးထားဆောင်ရွက်လျက်ရှိသည်။`
  },
  mission: {
    en: `Our mission is to provide quality, inclusive, and accessible education to students from underserved communities, especially those with limited educational resources and opportunities. We aim to support every learner through meaningful teaching, a safe and caring environment, and opportunities to develop academic abilities, practical skills, good character, and a sense of responsibility toward their families and communities.`,
    mm: `ကျွန်ုပ်တို့၏ ရည်မှန်းချက်မှာ ပညာရေးအရင်းအမြစ်နှင့် အခွင့်အလမ်းများ အကန့်အသတ်ရှိသော လူမှုအသိုင်းအဝိုင်းများမှ ကျောင်းသား၊ ကျောင်းသူများအတွက် အရည်အသွေးရှိပြီး အားလုံးပါဝင်သင်ယူနိုင်သော ပညာရေးကို လက်လှမ်းမီစေရန် ဖြစ်သည်။ အဓိပ္ပာယ်ရှိသော သင်ကြားသင်ယူမှု၊ လုံခြုံနွေးထွေးသော ပတ်ဝန်းကျင်နှင့် ဖွံ့ဖြိုးတိုးတက်ရေးအခွင့်အလမ်းများမှတစ်ဆင့် ပညာရည်၊ လက်တွေ့ကျွမ်းကျင်မှု၊ ကောင်းမွန်သော ကိုယ်ကျင့်တရားနှင့် မိသားစု၊ လူမှုအသိုင်းအဝိုင်းအပေါ် တာဝန်ယူလိုစိတ်တို့ကို မြှင့်တင်ပေးရန် ဖြစ်သည်။`
  },
  vision: {
    en: `Our vision is to become a trusted and sustainable learning institution that empowers students to become knowledgeable, independent, compassionate, and responsible individuals. We aspire to build a future in which every child, regardless of background or financial circumstances, has the opportunity to pursue education, realize their potential, and contribute positively to society.`,
    mm: `ကျွန်ုပ်တို့၏ မျှော်မှန်းချက်မှာ အသိပညာပြည့်ဝမှု၊ ကိုယ်ပိုင်ရပ်တည်နိုင်မှု၊ ကိုယ်ချင်းစာတရားနှင့် တာဝန်ယူမှုတို့ရှိသော လူငယ်များကို ပြုစုပျိုးထောင်ပေးနိုင်သည့် ယုံကြည်စိတ်ချရပြီး ရေရှည်တည်တံ့သော ပညာရေးအဖွဲ့အစည်းတစ်ခု ဖြစ်လာရန်ဖြစ်သည်။ ကလေးတိုင်းသည် မိမိ၏ နောက်ခံအခြေအနေ၊ မိသားစု၏ ငွေကြေးအခြေအနေတို့ကြောင့် ပညာရေးအခွင့်အလမ်းများ ဆုံးရှုံးခြင်းမရှိဘဲ မိမိ၏ အလားအလာကို အပြည့်အဝဖော်ထုတ်ကာ လူ့အဖွဲ့အစည်းအတွက် အကျိုးပြုနိုင်သည့် အနာဂတ်တစ်ခုကို ကျွန်ုပ်တို့ မျှော်မှန်းထားသည်။`
  },
  principalMessage: {
    en: `Dear Students, Parents, Teachers, and Friends of Maw Goon Thit School,

Education is more than gaining knowledge; it is about discovering our abilities, building confidence, and learning how to live with dignity and purpose. At Maw Goon Thit School, I believe that every student has potential and deserves the chance to develop it. Whatever challenges our students may face, we will continue working together to create opportunities for learning, growth, and a brighter future.

To our students, never stop learning or believing in yourselves. To our parents, thank you for your trust and partnership. To our teachers, thank you for your dedication, patience, and commitment to our children's future. Together, let us build a school community founded on respect, compassion, and shared responsibility. Every small step we take today can create meaningful change for tomorrow.`,
    mm: `မော်ကွန်းသစ်ကျောင်းမှ ချစ်ခင်လေးစားရပါသော ကျောင်းသား၊ ကျောင်းသူများ၊ မိဘများ၊ ဆရာ၊ ဆရာမများနှင့် မိတ်ဆွေများခင်ဗျာ။

ပညာရေးဆိုသည်မှာ အသိပညာရရှိခြင်းတစ်ခုတည်း မဟုတ်ပါ။ မိမိ၏စွမ်းရည်ကို ရှာဖွေဖော်ထုတ်ခြင်း၊ ကိုယ့်ကိုယ်ကိုယ်ယုံကြည်မှု တည်ဆောက်ခြင်းနှင့် ဂုဏ်သိက္ခာရှိရှိ၊ ရည်ရွယ်ချက်ပြည့်ဝစွာ နေထိုင်တတ်ရန် သင်ယူခြင်းလည်း ဖြစ်ပါသည်။ မော်ကွန်းသစ်ကျောင်းတွင် ကျောင်းသားတိုင်း၌ ကိုယ်ပိုင်အလားအလာရှိပြီး ၎င်းကို ဖွံ့ဖြိုးတိုးတက်စေရန် အခွင့်အရေးရထိုက်သည်ဟု ကျွန်ုပ် ယုံကြည်ပါသည်။ ကျောင်းသားများ ရင်ဆိုင်ကြုံတွေ့ရသည့် အခက်အခဲများ မည်သို့ပင်ရှိစေကာမူ သင်ယူမှု၊ ကိုယ်ရည်ကိုယ်သွေးဖွံ့ဖြိုးမှုနှင့် ပိုမိုတောက်ပသော အနာဂတ်အတွက် အခွင့်အလမ်းများ ဖန်တီးပေးနိုင်ရန် ကျွန်ုပ်တို့ အတူတကွ ဆက်လက်ကြိုးပမ်းသွားမည် ဖြစ်ပါသည်။

ကျောင်းသား၊ ကျောင်းသူများအနေဖြင့် သင်ယူလေ့လာခြင်းကို မရပ်တန့်ကြပါနှင့်။ မိမိကိုယ်ကိုယ် ယုံကြည်မှုလည်း မပျောက်ဆုံးကြပါနှင့်။ မိဘများ၏ ယုံကြည်မှုနှင့် ပူးပေါင်းပါဝင်မှုအတွက် ကျေးဇူးတင်ရှိပါသည်။ ဆရာ၊ ဆရာမများ၏ စေတနာ၊ သည်းခံမှုနှင့် ကလေးများ၏ အနာဂတ်အတွက် ကြိုးစားအားထုတ်မှုများကိုလည်း အထူးကျေးဇူးတင်ရှိပါသည်။`
  },
  coreValues: {
    en: [
      { title: 'Excellence', desc: 'Encouraging continuous learning, improvement, and the pursuit of quality in everything we do.' },
      { title: 'Integrity', desc: 'Promoting honesty, fairness, accountability, and respect for others.' },
      { title: 'Compassion', desc: 'Understanding the needs of others and supporting students with kindness and empathy.' },
      { title: 'Inclusivity', desc: 'Respecting diversity and ensuring that every student feels welcomed, valued, and supported.' },
      { title: 'Responsibility', desc: 'Developing self-discipline, cooperation, leadership, and a commitment to the community.' },
    ],
    mm: [
      { title: 'အရည်အသွေးမြင့်မားမှု', desc: 'အစဉ်လေ့လာသင်ယူခြင်း၊ မိမိကိုယ်ကို တိုးတက်အောင်ကြိုးစားခြင်းနှင့် အရည်အသွေးကို အလေးထားခြင်း။' },
      { title: 'ရိုးသားဖြောင့်မတ်မှု', desc: 'ရိုးသားခြင်း၊ တရားမျှတခြင်း၊ တာဝန်ခံခြင်းနှင့် အခြားသူများကို လေးစားခြင်း။' },
      { title: 'ကိုယ်ချင်းစာတရား', desc: 'အခြားသူများ၏ လိုအပ်ချက်များကို နားလည်ပြီး ကြင်နာမှုဖြင့် ကူညီပံ့ပိုးခြင်း။' },
      { title: 'အားလုံးပါဝင်နိုင်မှု', desc: 'မတူကွဲပြားမှုများကို လေးစားပြီး ကျောင်းသားတိုင်းကို တန်ဖိုးထားကာ ပံ့ပိုးပေးခြင်း။' },
      { title: 'တာဝန်ယူမှု', desc: 'ကိုယ်ပိုင်စည်းကမ်း၊ ပူးပေါင်းဆောင်ရွက်မှု၊ ဦးဆောင်နိုင်မှုနှင့် လူမှုအသိုင်းအဝိုင်းအပေါ် တာဝန်သိစိတ်တို့ကို မြှင့်တင်ခြင်း။' },
    ]
  },
  whyChooseUs: {
    en: [
      'Education with a Purpose: Meaningful learning that prepares students for real-life challenges.',
      'Inclusive Learning Opportunities: Making education accessible to underserved communities.',
      'A Caring Environment: Respect, kindness, safety, and a sense of belonging.',
      'Holistic Development: Academic progress alongside character, creativity, and practical skills.',
      'Community Partnership: Students thrive when families, teachers, and communities work together.',
    ],
    mm: [
      'ရည်ရွယ်ချက်ရှိသော ပညာရေး - လက်တွေ့ဘဝ၏ စိန်ခေါ်မှုများကို ရင်ဆိုင်နိုင်ရန် အထောက်အကူပြုသော သင်ယူမှု။',
      'ပညာရေးအခွင့်အလမ်းများ - ပညာရေးအခွင့်အလမ်း နည်းပါးသော လူမှုအသိုင်းအဝိုင်းများမှ ကျောင်းသားများ ပညာသင်ယူနိုင်ရန်။',
      'နွေးထွေးသော သင်ယူမှုပတ်ဝန်းကျင် - လေးစားမှု၊ ကြင်နာမှု၊ လုံခြုံမှုနှင့် အချင်းချင်းလက်ခံမှု။',
      'ဘက်စုံဖွံ့ဖြိုးတိုးတက်မှု - ပညာရည်အပြင် ကိုယ်ကျင့်တရား၊ တီထွင်ဖန်တီးနိုင်မှုနှင့် လက်တွေ့ကျွမ်းကျင်မှု။',
      'လူမှုအသိုင်းအဝိုင်းနှင့် ပူးပေါင်းဆောင်ရွက်မှု - မိသားစု၊ ဆရာ၊ ဆရာမများနှင့် လူမှုအသိုင်းအဝိုင်း အတူတကွ ပူးပေါင်းဆောင်ရွက်မှု။',
    ]
  }
};

const ICONS = [Award, Heart, CheckCircle, Users, Star];

export default function About() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/settings')
      .then(r => setSettings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading...</div>;
  }

  // ===== Helper: Settings က Override လုပ်လို့ရ၊ မရှိရင် Default သုံး =====
  const getContent = (settingsKey, defaultKey) => {
    const override = settings[settingsKey];
    if (override && override.trim()) return override;
    return DEFAULT_CONTENT[defaultKey][language];
  };

  const history = getContent('school_history', 'history');
  const mission = getContent('school_mission', 'mission');
  const vision = getContent('school_vision', 'vision');
  const principalMessage = getContent('principal_message', 'principalMessage');

  const coreValues = DEFAULT_CONTENT.coreValues[language];
  const whyChooseUs = DEFAULT_CONTENT.whyChooseUs[language];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Hero ===== */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {settings.school_logo ? (
            <img src={settings.school_logo} alt="Logo"
              className="w-24 h-24 mx-auto mb-4 rounded-2xl object-contain bg-white p-2 shadow-lg" />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <School className="w-12 h-12" />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2">
            {settings.school_name || 'Maw Goon Thit School'}
          </h1>
          {settings.school_name_en && (
            <p className="text-blue-100 text-lg mb-4">{settings.school_name_en}</p>
          )}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">
              {language === 'mm' ? 'ပညာရေးကို အလင်းရောင် ဖြစ်စေဖို့' : 'Lighting the Path of Education'}
            </span>
          </div>
          <div className="mt-2 text-sm text-blue-100">
            <p className="font-medium">
              {language === 'mm' ? 'ကျောင်းအုပ်ကြီး' : 'Principal'}: {' '}
              <span className="font-bold text-white">
                {settings.principal_name || 'Mr. John Alex'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* ===== History ===== */}
        <section>
          <SectionHeader
            icon={BookOpen}
            title={language === 'mm' ? 'ကျောင်းသမိုင်း' : 'Our History'}
            subtitle={language === 'mm' ? 'School History' : '၁။ ကျောင်းသမိုင်း'}
          />
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{history}</p>
          </div>
        </section>

        {/* ===== Mission & Vision ===== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-8 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {language === 'mm' ? 'ရည်မှန်းချက်' : 'Our Mission'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'mm' ? 'Mission Statement' : '၂။ ရည်မှန်းချက်'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{mission}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 border-l-4 border-cyan-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {language === 'mm' ? 'မျှော်မှန်းချက်' : 'Our Vision'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'mm' ? 'Vision Statement' : '၃။ မျှော်မှန်းချက်'}
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{vision}</p>
          </div>
        </section>

        {/* ===== Core Values ===== */}
        <section>
          <SectionHeader
            icon={Heart}
            title={language === 'mm' ? 'အဓိကတန်ဖိုးထားမှုများ' : 'Core Values'}
            subtitle={language === 'mm' ? 'Core Values' : '၄။ အဓိကတန်ဖိုးထားမှုများ'}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {coreValues.map((v, i) => {
              const Icon = ICONS[i] || Award;
              return (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-2">{v.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Principal's Message ===== */}
        <section>
          <SectionHeader
            icon={User}
            title={language === 'mm' ? 'ကျောင်းအုပ်ကြီး၏ သတင်းစကား' : "Principal's Message"}
            subtitle={language === 'mm' ? "Principal's Message" : '၅။ ကျောင်းအုပ်ကြီး၏ သတင်းစကား'}
          />
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-sm p-8 border border-blue-200">
            <div className="flex items-start gap-6 flex-col md:flex-row">
              {settings.principal_signature ? (
                <img src={settings.principal_signature} alt="Principal"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-md">
                  JA
                </div>
              )}
              <div className="flex-1">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 italic">
                  {principalMessage}
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <p className="font-bold text-gray-800">
                    {settings.principal_name || 'Mr. John Alex'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'mm' ? 'ကျောင်းအုပ်ကြီး' : 'Principal'},{' '}
                    {settings.school_name || 'Maw Goon Thit School'}
                  </p>
                  {settings.principal_phone && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {settings.principal_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Why Choose Us ===== */}
        <section>
          <SectionHeader
            icon={Award}
            title={language === 'mm' ? 'ကျောင်းကို ဘာကြောင့် ရွေးချယ်သင့်လဲ?' : 'Why Choose Us?'}
            subtitle={language === 'mm' ? 'Why Choose Us' : '၆။ ကျောင်းကို ဘာကြောင့် ရွေးချယ်သင့်လဲ?'}
          />
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyChooseUs.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-green-700 font-bold text-xs">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Contact ===== */}
        <section>
          <SectionHeader
            icon={MapPin}
            title={language === 'mm' ? 'ဆက်သွယ်ရန်' : 'Contact Us'}
            subtitle={language === 'mm' ? 'Contact' : 'ဆက်သွယ်ရန်'}
          />
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.school_address && (
                <ContactItem icon={MapPin} label={language === 'mm' ? 'လိပ်စာ' : 'Address'} value={settings.school_address} />
              )}
              {settings.school_phone && (
                <ContactItem icon={Phone} label={language === 'mm' ? 'ဖုန်း' : 'Phone'} value={settings.school_phone} />
              )}
              {settings.school_phone2 && (
                <ContactItem icon={Phone} label={language === 'mm' ? 'ဖုန်း ၂' : 'Phone 2'} value={settings.school_phone2} />
              )}
              {settings.school_email && (
                <ContactItem icon={Mail} label="Email" value={settings.school_email} />
              )}
              {settings.school_website && (
                <ContactItem icon={Globe} label="Website" value={settings.school_website} />
              )}
              {settings.established_year && (
                <ContactItem icon={Calendar} label={language === 'mm' ? 'တည်ထောင်နှစ်' : 'Established'} value={settings.established_year} />
              )}
            </div>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {settings.school_name || 'Maw Goon Thit School'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Built with ❤️ by <span className="font-bold text-blue-600">John Alex</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            MGT-School-Management-System v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}