const rows:Record<string,readonly [string,string]>={
 'zh-Hans':['收起颜色面板','展开颜色面板'],
 'zh-Hant':['收起顏色面板','展開顏色面板'],
 en:['Hide color panel','Show color panel'],
 ja:['カラーパネルを閉じる','カラーパネルを開く'],
 ko:['색상 패널 숨기기','색상 패널 표시'],
 fr:['Masquer le panneau des couleurs','Afficher le panneau des couleurs'],
 de:['Farbpalette ausblenden','Farbpalette einblenden'],
 es:['Ocultar panel de colores','Mostrar panel de colores'],
 'pt-BR':['Ocultar painel de cores','Mostrar painel de cores'],
 ru:['Скрыть панель цветов','Показать панель цветов'],
 ar:['إخفاء لوحة الألوان','إظهار لوحة الألوان'],
 hi:['रंग पैनल छिपाएँ','रंग पैनल दिखाएँ'],
};
export const uiMessages:Record<string,Record<string,string>>=Object.fromEntries(Object.entries(rows).map(([code,[hide,show]])=>[code,{'ui.hideColors':hide,'ui.showColors':show}]));
