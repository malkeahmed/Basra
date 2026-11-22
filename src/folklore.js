/* فلكلور البصرة: ٧ أبواب، لكل باب ٥ صور.
   place هو مكان التصوير الحقيقي، و by/lic/src نسبة الصورة المطلوبة قانونياً، و pos موضع القصّ، و bg يعرض الصورة كاملة فوق هذا اللون.
   لإبدال صورة: ضع الملف في public/assets وغيّر img ومعه place وby وlic وsrc. */
export const folklore = [
  {
    id: 'arch', title: 'العمارة والتراث البصري', short: 'العمارة',
    intro: 'شناشيل خشبية تطلّ على الأزقّة والأنهار، وبيوت من الطابوق ما زالت تحفظ ذاكرة المدينة.',
    items: [
      {
        img: 'f-shanasheel.jpg', cap: 'شناشيل البصرة', note: 'شرفات خشبية معلّقة على واجهات البيوت', place: 'البصرة القديمة',
        by: 'Hekmat Al-Ayashi', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:%D8%B4%D9%86%D8%A7%D8%B4%D9%8A%D9%84_%D8%A7%D9%84%D8%A8%D8%B5%D8%B1%D8%A9_%D8%A7%D9%84%D9%82%D8%AF%D9%8A%D9%85%D8%A9.jpg',
      },
      {
        img: 'fk-arch-new2.jpg', cap: 'الشنشول', note: 'نقوش الخشب فوق جدران الطابوق', place: 'البصرة القديمة',
        by: 'Lordali91', lic: 'CC BY-SA 3.0', licUrl: 'https://creativecommons.org/licenses/by-sa/3.0', src: 'https://commons.wikimedia.org/wiki/File:Basrah.JPG',
      },
      {
        img: 'fk-arch-new1.jpg', cap: 'بيوت تتقابل', note: 'شرفات تكاد تتلامس فوق الزقاق', place: 'البصرة، ٢٠٢٢',
        by: 'Mar Sharb', lic: 'CC BY 2.0', licUrl: 'https://creativecommons.org/licenses/by/2.0', src: 'https://commons.wikimedia.org/wiki/File:Chaldean_old_houses_in_Basra.jpg',
      },
      {
        img: 'f-ashar-boat.jpg', cap: 'أنهار البصرة', note: 'قارب خشبي بين جدران الطابوق', place: 'البصرة القديمة، ٢٠٢٢',
        by: 'حكمت العياشي', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:%D9%85%D9%86%D8%B8%D8%B1_%D9%85%D9%86_%D8%B4%D9%86%D8%A7%D8%B4%D9%8A%D9%84_%D8%A7%D9%84%D8%A8%D8%B5%D8%B1%D8%A9_View_From_Basra_Shanasheel.jpg',
      },
      {
        img: 'mirbad-old.jpg', cap: 'العشّار قديماً', note: 'سوق وقوارب على ضفّتي الخليج', place: 'خليج العشّار، البصرة',
        by: 'مصوّر مجهول', lic: 'CC0', src: 'https://commons.wikimedia.org/wiki/File:Ashar_Creek_and_Bazaar,_Bestanddeelnr_158-1494.jpg',
      },
    ],
  },
  {
    id: 'music', title: 'الفنون والموسيقى الشعبية', short: 'الموسيقى',
    intro: 'في البصرة يلتقي إيقاع الخليج بنغم العراق؛ طبولٌ وموّالٌ ومقامٌ تُحيي به الليالي على ضفاف شطّ العرب.',
    items: [
      {
        img: 'fk-music-new1.jpg', cap: 'العود', note: 'آلة الشرق الأولى في سهرات الغناء', place: 'شارع المتنبي، بغداد',
        pos: '50% 25%', by: 'Safa.daneshvar', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:001126-AlMutanabbi-Baghdad-IMG_8201-2.jpg',
      },
      {
        img: 'fk-music-new2.jpg', cap: 'الطبلة', note: 'طبلة من الفخار والجلد صُنعت في العراق', place: 'صُنعت في بغداد ١٩٥٧، متحف الآلات الموسيقية في فينيكس',
        bg: '#75762c', by: 'bobistraveling', lic: 'CC BY 2.0', licUrl: 'https://creativecommons.org/licenses/by/2.0', src: 'https://commons.wikimedia.org/wiki/File:Cernamic_Drum_MIM_Museum_Phoenix_AZ_135435_(40263496112).jpg',
      },
      {
        img: 'fk-music-new3.jpg', cap: 'عازف الجوزة', note: 'الفنان العراقي باسم هوار مع الجوزة', place: 'حفل في كولونيا، ألمانيا',
        bg: '#24170f', by: 'Raimond Spekking', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Mariana_Sadovska_-_Borderland_-_Bassem_Hawar_-_Djoze_(1362).jpg',
      },
      {
        img: 'fk-music-new4.jpg', cap: 'الجوزة', note: 'كمان عراقي صغير صوته قريب من صوت الإنسان', place: 'آلات الفنان باسم هوار',
        by: 'Bassem Hawar', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:%D8%A7%D9%84%D8%A7%D8%AA_%D8%A8%D8%A7%D8%B3%D9%85_%D9%87%D9%88%D8%A7%D8%B1_%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%8A%D9%82%D9%8A%D8%A9.jpg',
      },
      {
        img: 'fk-music-new5.jpg', cap: 'السنطور العراقي', note: 'أوتار تُطرق بمضربين خفيفين', place: 'آلة عراقية تقليدية',
        by: 'Santuurchi', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Iraqi_Santur.tiff',
      },
    ],
  },
  {
    id: 'dance', title: 'الرقصات الشعبية', short: 'الرقصات',
    intro: 'رقصات جماعية تعرفها الأعراس والمواسم في الجنوب، يتشابك فيها الإيقاع والحركة والهتاف.',
    items: [
      {
        img: 'fk-dance-new1.jpg', cap: 'الچوبي', note: 'صفّ واحد وخطوة واحدة في الأعراس', place: 'العراق',
        by: 'Qizilqurt', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Iraqis_dancing_chobi.jpg',
      },
      {
        img: 'fk-dance-new2.jpg', cap: 'رقصة الراية', note: 'رجال يحتفلون بالراية والهتاف', place: 'حديثة، الأنبار، ٢٠٠٨',
        by: 'Cpl. Erik Villagran', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Iraq_Celebration.JPG',
      },
      {
        img: 'fk-dance-new3.jpg', cap: 'الطبل والرقص', note: 'الطبل يقود الراقصين في الشارع', place: 'الكرمة، الأنبار، ٢٠٠٨',
        by: 'Lance Cpl. Stuart Wegenka', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Iraqi_civilians_play_music_and_dance_at_a_ceremony_commemorating_the_opening_of_a_civilian_road_outside_Forward_Operating_Base_Omar,_near_Karmah,_Iraq,_April_14,_2008,_during_Operation_Iraqi_Freedom_080414-M-RF524-010.jpg',
      },
      {
        img: 'fk-dance-new4.jpg', cap: 'رقصة شعبية', note: 'سيف وطبل وتصفيق في صورة قديمة', place: 'العراق، صورة من الأرشيف',
        by: 'مصوّر مجهول', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Traditional_iraqi_dance.jpg',
      },
      {
        img: 'fk-dance-new5.jpg', cap: 'چوبي الشمال', note: 'الرقصة نفسها بثياب سهل نينوى', place: 'برطلة، نينوى، ١٩٨٠',
        by: 'Haleem Alkhatat', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Assyrian_Chobi_in_Bartella.jpg',
      },
    ],
  },
  {
    id: 'dress', title: 'الملابس والعادات الشعبية', short: 'اللباس',
    intro: 'الدشداشة والعباءة والكوفية، ثياب تلائم الحرّ والماء، وفي الأهوار لباسٌ يشبه الأرض التي حوله.',
    items: [
      {
        img: 'fk-swamp-1.jpg', cap: 'ثياب الأهوار', note: 'ثوب واسع وغطاء رأس يلائمان الحرّ والماء', place: 'أهوار قرب البصرة',
        pos: '50% 30%', by: 'Karl Oppolzer', lic: 'CC BY-SA 3.0', licUrl: 'https://creativecommons.org/licenses/by-sa/3.0', src: 'https://commons.wikimedia.org/wiki/File:Swamp_dwellers_near_Basra,_Iraq_1.JPG',
      },
      {
        img: 'fk-dress-new1.jpg', cap: 'الثوب المطرّز', note: 'ألوان زاهية وتطريز عند الصدر', place: 'قرية الكثرة، أهوار العراق، ٢٠١٠',
        pos: '50% 28%', by: 'James Gordon from Los Angeles, California, USA', lic: 'CC BY 2.0', licUrl: 'https://creativecommons.org/licenses/by/2.0', src: 'https://commons.wikimedia.org/wiki/File:Marsh_Arab_girl.jpg',
      },
      {
        img: 'fk-dress-new2.jpg', cap: 'الكوفية والدشداشة', note: 'لباس رجل الأهوار فوق زورقه', place: 'أهوار جنوب العراق، ٢٠٢٥',
        by: 'Sajadabdalilah', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Marsh_Arabs_of_southern_Iraq.jpg',
      },
      {
        img: 'fk-dress-new3.jpg', cap: 'العباءة والشيلة', note: 'السواد التقليدي لنساء الجنوب', place: 'جنوب العراق، ٢٠٢٥',
        pos: '50% 25%', by: 'SajaAlrubaie', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:An_Iraqi_Southern_woman_in_traditional_abaya_and_Sheila_-_Cultural_Heritage.jpg',
      },
      {
        img: 'fk-dress-new4.jpg', cap: 'العباءة عند الماء', note: 'ظلّ امرأة على ضفّة الهور', place: 'أهوار العراق، ١٩٧٨',
        pos: '50% 45%', by: 'Paul Dober', lic: 'CC BY 3.0', licUrl: 'https://creativecommons.org/licenses/by/3.0', src: 'https://commons.wikimedia.org/wiki/File:Iraq_people_of_the_marshes_1978_-_panoramio_(1).jpg',
      },
    ],
  },
  {
    id: 'crafts', title: 'الحرف والصناعات اليدوية', short: 'الحِرف',
    intro: 'من القصب والنخل والخشب تصنع يدُ البصري زورقه وحصيره وبيته؛ حِرَفٌ توارثتها الأجيال.',
    items: [
      {
        img: 'fk-mashoof-2.jpg', cap: 'المشحوف', note: 'زورق رشيق يُدفع بالمردي', place: 'محافظة البصرة، ٢٠٠٨',
        by: 'Sgt. Gustavo Olgiati', lic: 'ملكية عامة', licUrl: 'https://creativecommons.org/publicdomain/mark/1.0/', src: 'https://commons.wikimedia.org/wiki/File:Mashoof_12.19.08_(2).jpg',
      },
      {
        img: 'fk-crafts-new1.jpg', cap: 'بيت القصب', note: 'حزم القصب تصير أعمدة وجدراناً', place: 'أهوار العراق، ١٩٧٨',
        by: 'Paul Dober', lic: 'CC BY 3.0', licUrl: 'https://creativecommons.org/licenses/by/3.0', src: 'https://commons.wikimedia.org/wiki/File:Reed_house_under_construction,_Iraq_marshes_1978_-_panoramio.jpg',
      },
      {
        img: 'fk-crafts-new2.jpg', cap: 'تسقيف المضيف', note: 'حزم القصب تُشدّ فوق الأقواس', place: 'أهوار جنوب العراق، ٢٠٢٢',
        by: 'Hassan Al-Jarrah', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Roofing_of_reed_Mudhif_-_guesthouse,_Southern_marshlands,_Iraq.jpg',
      },
      {
        img: 'fk-crafts-new3.jpg', cap: 'صناعة النحاس', note: 'سوق الصفّارين ورنين المطارق', place: 'سوق الصفّارين، بغداد، الثلاثينيات',
        by: 'مصوّر مجهول', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:The_Al-Safafir_Market,_Baghdad,_1930s.png',
      },
      {
        img: 'fk-crafts-new4.jpg', cap: 'النسيج', note: 'نول خشبي لحياكة البُسط', place: 'المتحف البغدادي، بغداد',
        by: 'Aziz1005', lic: 'CC BY-SA 3.0', licUrl: 'https://creativecommons.org/licenses/by-sa/3.0', src: 'https://commons.wikimedia.org/wiki/File:IRAQI_Carpet_making.jpg',
      },
    ],
  },
  {
    id: 'customs', title: 'العادات والتقاليد الاجتماعية', short: 'التقاليد',
    intro: 'الكرم في البصرة طقس: مضيف مفتوح، وقهوة مرّة، وتمر يُقدَّم قبل السؤال عن الاسم.',
    items: [
      {
        img: 'fk-customs-new1.jpg', cap: 'مجلس المضيف', note: 'الضيوف على الجانبين والصدر للكبار', place: 'أهوار جنوب العراق، ٢٠٠٤',
        pos: '50% 70%', by: 'Hassan Janali, U.S. Army Corps of Engineers', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Iraqi_mudhif_interior.jpg',
      },
      {
        img: 'fk-customs-new2.jpg', cap: 'طقس القهوة', note: 'الدلال حول النار قبل أن يبدأ الحديث', place: 'أهوار العراق، ١٩٧٨',
        by: 'Paul Dober', lic: 'CC BY 3.0', licUrl: 'https://creativecommons.org/licenses/by/3.0', src: 'https://commons.wikimedia.org/wiki/File:Coffee_ceremony,_Iraq_people_of_the_marshes_1978_-_panoramio.jpg',
      },
      {
        img: 'fk-customs-new3.jpg', cap: 'باب مفتوح', note: 'المضيف بيت لكل قادم', place: 'البو حمرة، ذي قار، ٢٠١٦',
        pos: '50% 45%', by: 'David Stanley from Nanaimo, Canada', lic: 'CC BY 2.0', licUrl: 'https://creativecommons.org/licenses/by/2.0', src: 'https://commons.wikimedia.org/wiki/File:Mudhif_Reception_Hall_(30943793762).jpg',
      },
      {
        img: 'fk-customs-new4.jpg', cap: 'موسم التمر', note: 'غربلة التمر باليد كما في الماضي', place: 'العراق، ٢٠١٧',
        by: 'Taisir85', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:Date_filtering.jpg',
      },
      {
        img: 'fk-customs-new5.jpg', cap: 'المسگوف', note: 'سمكة على النار تجمع الأهل والضيوف', place: 'العراق، ٢٠١٠',
        by: 'Al Jazeera English', lic: 'CC BY-SA 2.0', licUrl: 'https://creativecommons.org/licenses/by-sa/2.0', src: 'https://commons.wikimedia.org/wiki/File:Masgouf,_an_Iraqi_tradition_-_Flickr_-_Al_Jazeera_English.jpg',
      },
    ],
  },
  {
    id: 'proverbs', title: 'الأمثال الشعبية', short: 'الأمثال',
    intro: 'حكمة الناس في جمل قصيرة، تتناقلها البيوت والأسواق وتُقال في كل مناسبة.',
    items: [
      {
        img: 'fk-proverbs-new1.jpg', cap: 'الصبر مفتاح الفرج', note: 'من صبر وصل', place: 'مقهى الشابندر، بغداد، ٢٠١٦',
        pos: '50% 30%', by: 'Mondalawy', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:%D9%85%D8%AD%D9%85%D8%AF_%D8%A7%D9%84%D8%AE%D8%B4%D8%A7%D9%84%D9%8A_%D9%85%D8%A7%D9%84%D9%83_%D9%85%D9%82%D9%87%D9%89_%D8%A7%D9%84%D8%B4%D8%A7%D8%A8%D9%86%D8%AF%D8%B1.jpg',
      },
      {
        img: 'fk-proverbs-new2.jpg', cap: 'الجار قبل الدار', note: 'اختر جارك قبل أن تختار بيتك', place: 'زقاق في البصرة، ٢٠١٦',
        by: 'David Stanley from Nanaimo, Canada', lic: 'CC BY 2.0', licUrl: 'https://creativecommons.org/licenses/by/2.0', src: 'https://commons.wikimedia.org/wiki/File:Basra_Back_Street_(31095180711).jpg',
      },
      {
        img: 'fk-proverbs-new3.jpg', cap: 'اليد الواحدة ما تصفّق', note: 'التعاون أساس كل عمل', place: 'سوق الموصل، ١٩٣٢',
        by: 'G. Eric and Edith Matson', lic: 'ملكية عامة', src: 'https://commons.wikimedia.org/wiki/File:Crowded_marketplace_(Mosul,_1932).jpg',
      },
      {
        img: 'fk-proverbs-new4.jpg', cap: 'العتب على قدر المحبّة', note: 'من يحبّك يعاتبك', place: 'شاي الشابندر، بغداد',
        by: 'Mondalawy', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:%D8%B4%D8%A7%D9%8A_%D8%A7%D9%84%D8%B4%D8%A7%D8%A8%D9%86%D8%AF%D8%B1.jpg',
      },
      {
        img: 'fk-proverbs-new5.jpg', cap: 'ربّ أخٍ لك لم تلده أمّك', note: 'الصديق الوفيّ أخ', place: 'مقهى في كردستان العراق، ٢٠١٨',
        pos: '50% 55%', by: 'Haremhassan', lic: 'CC BY-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-sa/4.0', src: 'https://commons.wikimedia.org/wiki/File:An_old_man_reading_in_the_tea_house.jpg',
      },
    ],
  },
]
