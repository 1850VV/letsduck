from pathlib import Path
import json, collections, textwrap, shutil
from PIL import Image,ImageDraw,ImageFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'outputs'/'XGO_Duck_DeepSeek'
D=json.loads((OUT/'BOM_and_all_source_parameters.json').read_text()); V=json.loads((OUT/'verification.json').read_text())
parts=[r for p in D['plates'] for r in p['parts']]
pdfmetrics.registerFont(TTFont('CN','/Library/Fonts/Arial Unicode.ttf'))
PDF=OUT/'XGO_Duck_DeepSeek_printing_guide.pdf'
c=canvas.Canvas(str(PDF),pagesize=(595.276,841.89))
c.setTitle('XGO Duck V2 | DeepSeek 蓝白黑逐板打印配色与 BOM')
c.setAuthor('Prepared from uploaded XGO_duckV2.3mf')
W,H=595.276,841.89; M=38; CW=W-2*M
BLUE='#0056B8'; INK='#142B4E'; GRAY='#52627A'; LIGHT='#EDF2F8'
def txt(x,y,s,size=10,color=INK):
    c.setFillColor(HexColor(color));c.setFont('CN',size);c.drawString(x,y,str(s))
def wrap(s,size,width):
    lines=[];line=''
    for ch in str(s):
        if ch=='\n':lines.append(line);line='';continue
        if pdfmetrics.stringWidth(line+ch,'CN',size)>width and line:lines.append(line);line=ch
        else:line+=ch
    if line:lines.append(line)
    return lines
def para(s,y,size=10,leading=17,x=M,width=CW,color=INK):
    for line in wrap(s,size,width):txt(x,y,line,size,color);y-=leading
    return y-8
def header(k,title,sub):
    c.setFillColor(HexColor('#4D6BFE'));c.rect(0,H-12,W,12,fill=1,stroke=0)
    txt(M,H-48,k,9,GRAY);txt(M,H-80,title,24);txt(M,H-103,sub,9,GRAY)
def footer(n):
    c.setStrokeColor(HexColor('#D7E0EB'));c.line(M,40,W-M,40)
    txt(M,25,'XGO Duck V2 · 2026-10-22 · 依据上传 3MF 的实际对象与网格',8,GRAY)
    txt(W-M-25,25,f'{n:02d}/10',8,GRAY);c.showPage()
def table(headers,rows,widths,x=M,top=700,rowh=27,size=9):
    c.setFillColor(HexColor(INK));c.rect(x,top-rowh,sum(widths),rowh,fill=1,stroke=0)
    xx=x
    for text,w in zip(headers,widths):txt(xx+7,top-rowh+9,text,size,'#FFFFFF');xx+=w
    y=top-rowh
    for ri,row in enumerate(rows):
        c.setFillColor(HexColor('#F0F4F9' if ri%2==0 else '#FFFFFF'));c.rect(x,y-rowh,sum(widths),rowh,fill=1,stroke=0)
        xx=x
        for text,w in zip(row,widths):
            lines=wrap(text,size,w-12)
            assert len(lines)<=2,(str(text),w,lines)
            for j,line in enumerate(lines):txt(xx+6,y-rowh+rowh/2+(3 if len(lines)==1 else 6)-j*(size+2),line,size)
            xx+=w
        y-=rowh
    return y

SUMMARY=[
 ['01','TPU','4','黑色 TPU 90A','软喙与脚底'],
 ['02','yellow pla','7','钴蓝 PLA Basic','下巴、平台、脚、轴、眼壳'],
 ['03','black pla','5','黑色 PLA Basic','眼睛与关节连接'],
 ['04','未命名','3','白色 PLA Basic','头盖、固定件、背板'],
 ['05','未命名','7','白色 PLA Basic','大腿、机身、支撑、电池仓'],
 ['06','未命名','9','白色 PLA Basic','颈、腿及关节结构']]
hardware=[
 ['Arduino Uno Q','1','原文指定控制器'],['XGO-Duck 扩展板','1','68.55 × 53.38 mm；QMI8658A'],
 ['Feetech HD-1910-C001 舵机','15','34 × 20 × 23 mm；4-8.4 V'],
 ['舵机连接线','15','AMP2.0-3P；150 ± 5 mm；原文称默认随舵机'],
 ['电池组及充电器','1 套','原文：18650 电池组；8.4 V；>2500 mAh；>3C'],
 ['M2 × 6 沉头螺丝','200','采购参考数，未核实实际装配用量'],
 ['M2.5 × 6 螺丝','6','用于舵机输出轴固定；头型需复核'],
 ['M3 × 16 螺丝','4','头型需复核'],['10 × 15 × 3 mm 轴承','2','内径 × 外径 × 厚度'],
 ['16 × 22 × 4 mm 轴承','11','内径 × 外径 × 厚度']]

# 1: cover and shop-order overview.
header('PRINT ORDER / 商家交付版','XGO Duck V2 配色与打印清单','6 个原打印板 · 25 个对象 · 35 个零件实例 · 原比例 / 原材料预设保留')
y=H-145
for label,color,caption in [('品牌参考','#4D6BFE','用户指定'),('实打钴蓝','#0056B8','PLA Basic'),('白色','#FFFFFF','PLA Basic'),('黑色','#000000','PLA / TPU')]:
    i=['品牌参考','实打钴蓝','白色','黑色'].index(label);x=M+i*132
    c.setStrokeColor(HexColor('#CBD5E2'));c.setFillColor(HexColor(color));c.roundRect(x,y-38,116,38,5,fill=1,stroke=1)
    txt(x,y-57,label,10);txt(x,y-73,color+'  '+caption,8,GRAY)
y=para('设计：白色外壳作为主体；原橙色的 7 件 PLA 统一改为钴蓝；5 件黑色 PLA 保留黑色；软喙和两块脚底统一使用黑色 TPU。每板为单一颜色与材料，便于商家分板打印。',y-103)
y=table(['板号','原板名','件数','交付颜色 / 材料','范围'],SUMMARY,[35,82,34,145,CW-296],top=y+5,rowh=35,size=8.5)
y=para('重要：原工程 TPU 是 90A，不是 95A。主交付 3MF 保留 Bambu TPU 90A @BBL P1P 预设。95A 蓝 / 黑仅作替代选项，需商家重选参数并试装；本包没有把 95A 冒充为已验证原材料。',y-22,10,17)
y=para('钴蓝 #0056B8 是拓竹官方色表中的 PLA Basic 颜色。它与品牌蓝 #4D6BFE 有明显差异。本方案选择可采购的现成钴蓝，不承诺色差为零；订料前请商家提供实物色卡。',y,9.5,16)
y=para('交付范围：完整打印件 BOM、逐板定位图、原文列出的五金 / 电子件采购参考、全部原工程参数、改色副本及校验记录。没有修改几何，也没有新增实体 Logo。',y,9.5,16)
footer(1)

# 2-7: one complete plate per page, all 35 instances.
for plate in D['plates']:
    n=plate['plate']; pp=plate['parts'];r=pp[0]
    header(f'PLATE {n:02d} / 定位与材料',f'第 {n} 板 · {r["new_color_name"]} {r["material"]}',
           f'原板名：{plate["original_name"] or "未命名"}  |  {len(plate["object_ids"])} 个对象 / {len(pp)} 个零件实例  |  材料槽 {r["slot"]}')
    c.drawImage(str(OUT/f'Plate_{n}_map.png'),M,H-465,350,350)
    c.drawImage(str(ROOT/'work'/f'iso_{n}.png'),M+360,H-310,155,155)
    txt(M+364,H-324,'真实网格等轴测视图',8,GRAY)
    yy=H-356
    for line in wrap('左图：原打印摆放的俯视图。数字与下表对应；左右及前后以原工程坐标为准。网格间距 32 mm，图像本身不作量具。',9,147):
        txt(M+364,yy,line,9,GRAY);yy-=15
    note='全板改为黑色；保留 90A 柔性预设。' if n==1 else ('原黄 / 橙色全板改为钴蓝。原板名未改。' if n==2 else '保持原工程颜色类别与材料。')
    txt(M,H-484,note,9,BLUE)
    rows=[]
    for p in pp:
        sx=' × '.join(f'{v:.2f}' for v in p['print_size_mm'])
        rows.append([p['code'].split('-')[1],p['part_name'],f'{p["object_id"]} / {p["part_id"]}',sx,'1'])
    y=table(['图号','零件名（完整原名）','对象 / 零件 ID','打印姿态包围尺寸 mm','数量'],rows,[30,191,70,194,34],top=H-502,rowh=24,size=8)
    if n in (3,5,6):
        msg={3:'对象 24（两块脖子连接板）：原有 100% zig-zag 填充覆盖，继续保留。',
             5:'对象 22（两块大腿支撑）：原有 100% zig-zag 填充覆盖。对象 53 含左右机身壳两零件。',
             6:'对象 28（两块 Roll 舵机盖板）：原有 100% zig-zag 填充覆盖，继续保留。'}[n]
        para(msg,y-18,8.5,14)
    else: para('尺寸来自原始网格叠加 component / build 变换后的轴对齐包围盒，保留两位小数供识别；不是装配公差。',y-18,8.5,14)
    footer(n+1)

# 8: actual parameters, conflicts and material substitution.
header('SETTINGS / 原工程实读','材料与打印参数核对','本页报告文件里的实际值；没有把这些设置认定为已完成实打验证')
y=table(['材料槽','原预设（完整名称）','原色 → 新色','实例数'],[
 ['1','Bambu PLA Basic @BBL P1P','白 → 白 #FFFFFF','19'],
 ['2','Bambu PLA Basic @BBL P1P','黑 → 黑 #000000','5'],
 ['3','Bambu PLA Basic @BBL P1P','橙 → 钴蓝 #0056B8','7'],
 ['4','Bambu TPU 90A @BBL P1P','白 → 黑 #000000','4']],
 [42,220,215,42],top=H-126,rowh=32,size=8.1)
for s in [
 '设备预设：Bambu Lab P1P 0.4 nozzle。层高 0.20 mm；Textured PEI Plate。耗材直径 1.75 mm。PLA 密度 1.26 g/cm³；TPU 密度 1.24 g/cm³（原工程参数，不是实测值）。',
 '实际全局：3 层墙；10% gyroid 填充；顶层 5 / 底层 3；树状自动支撑，阈值 30°；非仅热床支撑；auto_brim，宽 5 mm。保留所有对象覆盖和可变层高文件。',
 '对象 22、24、28：sparse / skin / skeleton 填充密度均覆盖为 100%，sparse pattern 为 zig-zag。其他对象采用原工程继承关系。',
 '喷嘴常温 / 首层原数组均为 [220,220,220,220,220,220,225,225] °C。热床 hot_plate_temp / textured_plate_temp 原数组均为 [65,65,65,35] °C。八元素数组属于原工程格式，未改写或重新解释通道。',
 '流量比例原数组：[0.98,0.985,0.98,0.985,0.98,0.985,1,1]；最大体积流量：[21,29,21,29,21,29,2.8,2.8] mm³/s。全部字段及数组原样导出至 JSON，可核查各继承参数。',
 '原文冲突：3MF Description 写“4 层墙、13% 螺旋填充”，实际全局却是 3 层墙、10% gyroid。没有擅自决定哪个版本正确。请商家保留原摆放，并在报价 / 切片单上明确最终采用的墙层和填充。',
 '如采购 TPU 95A：黑色用于 P1-01 至 P1-04；若另选蓝色，只作为软喙 P1-01 / P1-02 的可选外观方案，脚底仍为黑色。此可选拆色未写入主交付 3MF。必须使用对应 95A 耗材预设、校准并先试装；不能沿用 90A 温度 / 流量当作已验证方案。',
 '90A / 95A 软料请由商家按机器和厂家要求选择外置直供等路径；不得把 TPU for AMS 当成同硬度替代。现货、色差、硬度证书和实际送料兼容性均由商家核对。']:
    y=para(s,y-14,9,15)
assert y>50,y
footer(8)

# 9: non-print BOM from embedded description, with clear evidence boundaries.
header('BOM / 原文采购参考','五金、电子件与下单说明','下表来源：上传 3MF 内嵌 Description；未对照完整装配指南复核版本与安装用量')
y=table(['名称','参考数','原文规格 / 核对点'],hardware,[183,42,294],top=H-126,rowh=28,size=8.4)
for s in [
 '另需耗材、胶黏剂、USB 数据线和组装工具；数量与规格未在该文件中给全，不能从网格推定。螺丝数量尤其是 M2 × 6 的 200 颗，是原文采购参考，不是本次逐孔核实结果。',
 '给商家：按原 6 板、原坐标、原比例打印，共 35 个零件实例；板 1 黑色 TPU 90A；板 2 钴蓝 PLA Basic；板 3 黑色 PLA Basic；板 4-6 白色 PLA Basic。',
 '所有 2x 名称均已在工程中放置两件。不要再次乘二。原有对象和零件分组用于定位与保持设置，不应自动合并或自动旋转；先试打轴承座 / 舵机安装座并检查孔、槽及配合面。',
 '原文件包含自动支撑、热床和设备参数，商家需对照自己的机器重新切片。输出耗材克数、支撑 / 清洗用量、打印时间和报价；本包没有 G-code，因此这些数值尚未知。',
 '色彩按实物线材色卡验收：品牌蓝 #4D6BFE 仅为设计方向；本方案实打蓝选 PLA Basic Cobalt Blue #0056B8。PLA 与 TPU 黑色可因表面和批次不同出现色差。',
 '打印件交付验收：35 件齐套；左右件与数量正确；软件仍为 TPU；孔和槽清洁、无强行扩孔或改尺寸；最终装配与行走效果需要另行实物验证。']:
    y=para(s,y-8,9,14)
assert y>50,y
footer(9)

# 10: explicit acceptance evidence and source links.
header('EVIDENCE / 交付检查','已核实与仍待核实','报告的边界：文件与几何检查通过，不等同于切片、实打、装配或颜色验收通过')
items=[
 ('全部 6 板 / 对象 / 零件','通过','读取 model_settings.config 的板归属、25 个对象、35 个零件实例；关联 28 个网格资源。'),
 ('材料与对象覆盖','通过','读取全部 project_settings.config；导出完整字段、原名、ID、槽号、变换、尺寸和对象 / 零件参数。'),
 ('几何与尺寸不变','通过','所有 3D/*.model 的解压字节完全相同；component / build / assemble、可变层高、支撑及对象设置未改。'),
 ('改色范围与封装','通过','64 个包成员齐全，ZIP CRC 通过；仅一个成员的 filament_colour 与 filament_multi_colour 两字段改变。'),
 ('全部板图与清单','通过','板图从真实网格及原打印变换生成；每个实例有唯一 P板号-图号；打印件合计 35。'),
 ('Bambu Studio 打开 / 切片','未执行','本机未安装 Bambu Studio；未验证该应用重新加载或生成 G-code。请商家以“打开项目”方式检查。'),
 ('95A 替代、实物色差、装配','未验证','主文件保留 90A；未试印、未装配、未行走测试；未验证材料批次与品牌蓝色差。'),
 ('旧对话 / 参考照片','有限','原助手回复为内容引用占位符；取回原 3MF 和 6 板照片，照片仅交叉核对布局，不作为零件命名依据。')]
y=H-134
for title,status,body in items:
    txt(M,y,title,10);txt(W-M-58,y,status,9,BLUE if status=='通过' else '#9B5E19')
    y=para(body,y-19,9,14)
y=para('注意旧缩略图：为尽量少改原包，3MF 内嵌图片仍可能显示旧橙 / 白色；这不代表颜色字段未修改。请以打开项目后的材料槽及本册 / 新标注图为准。原板名 yellow pla 同样保留。',y-3,9,14)
txt(M,y-5,'来源与可追溯文件',10);y-=24
links=[('拓竹 PLA Basic 官方色表','https://store.bblcdn.eu/s8/default/903b60b06ac142e9b1b49ad53cfa4c82/Bambu_PLA_Basic_Hex_Code.pdf'),
       ('拓竹 TPU 90A 官方色表（含黑色）','https://store.bblcdn.com/s1/default/7e2c8bbbf2ff4c6996778bbb577bae13/Bambu_TPU_90A_Hex_Code_Table.pdf'),
       ('拓竹 AMS HT 官方手册（送料材料说明）','https://cdn1.bambulab.com/documentation/h2d/en/AMS_HT_20250109.pdf')]
for label,url in links:
    txt(M,y,label,8.5,BLUE);c.linkURL(url,(M,y-2,W-M,y+10));y-=18
y=para('原文件 SHA-256：'+V['source_sha256'],y-3,7.7,12)
y=para('改色文件 SHA-256：'+V['modified_sha256'],y,7.7,12)
assert y>43,y
footer(10);c.save()

# A complete plain-text order/BOM for copying into a shop message.
lines=['XGO Duck V2 — DeepSeek 蓝白黑打印交付说明','日期：2026-10-22','',
 '主方案：板1 黑色 TPU 90A；板2 钴蓝 PLA Basic；板3 黑色 PLA Basic；板4-6 白色 PLA Basic。',
 '请按原6板、原摆放、原尺寸打印，共25个对象、35个零件实例。不要因零件名带2x而再次乘二。',
 '品牌参考 #4D6BFE；可采购的现成蓝色采用 Bambu PLA Basic Cobalt Blue #0056B8，两者不是同一颜色。',
 '主3MF保留原Bambu TPU 90A预设。95A需另选预设、校准和试装，不在主文件中替换。','']
for p in D['plates']:
    lines.append(f'第{p["plate"]}板（原板名：{p["original_name"] or "未命名"}）')
    for r in p['parts']:
        dim=' × '.join(f'{x:.2f}' for x in r['print_size_mm'])
        lines.append(f'{r["code"]} | 对象{r["object_id"]} {r["object_name"]} | 零件{r["part_id"]}（序号{r["part_index"]+1}）{r["part_name"]} | 1件 | 槽{r["slot"]} {r["new_color_name"]} {r["material"]} | 打印包围尺寸 {dim} mm')
    lines.append('')
lines+=['数量汇总（以实际组件实例为准）：白色PLA 19件；钴蓝PLA 7件；黑色PLA 5件；黑色TPU 4件；共35件。',
 '完整打印件BOM（按原名归并，不会把2x再乘二）：']
groups=collections.OrderedDict()
for r in parts:
    k=(r['part_name'],r['material'],r['new_color_name']);groups.setdefault(k,[]).append(r['code'])
for (name,mat,col),codes in groups.items(): lines.append(f'{name} | {len(codes)}件 | {col} {mat} | '+', '.join(codes))
lines+=['','原工程重要参数：','P1P / 0.4 mm喷嘴；0.20 mm层高；Textured PEI Plate；1.75 mm耗材。',
 '全局3层墙、10% gyroid；顶5/底3；树状自动支撑、30°、非仅热床；auto_brim 5 mm。',
 '对象22/24/28为100% sparse/skin/skeleton密度覆盖；sparse pattern为zig-zag。',
 '喷嘴温度及首层原数组 [220,220,220,220,220,220,225,225] °C；热床hot_plate/textured原数组 [65,65,65,35] °C。',
 '流量比例 [0.98,0.985,0.98,0.985,0.98,0.985,1,1]；最大体积流量 [21,29,21,29,21,29,2.8,2.8] mm³/s。',
 '完整参数、所有原名和变换见 BOM_and_all_source_parameters.json；数组按原文件保留，不擅自扁平化。',
 '冲突：原3MF的Description建议4层墙/13%填充，与工程实际值不同。本次保留实际值，需商家在最终切片单中明确选择。','',
 '五金/电子BOM（只转录上传3MF内嵌说明，尚未核对装配版本或实际安装用量）：']
lines += [' | '.join(row) for row in hardware]
lines+=['另需耗材、胶黏剂、USB数据线和工具；文件未给完整规格/数量。','',
 '给商家的最终操作要求：',
 '1. 用“打开项目”载入改色3MF，核对4个材料槽、6个打印板、35个实例。不要只导入几何。',
 '2. 保持原比例、原摆放、原对象分组。不要自动旋转/合并。先试打轴承座及舵机安装座。',
 '3. 重新选择实际打印机、热床与真实耗材；保留所有对象覆盖，并明确墙层/填充冲突的处理。',
 '4. 若换95A，请重新使用真实95A预设，核对硬度、柔性、抓地和软喙配合；脚底保持黑色。',
 '5. 如希望软喙使用蓝TPU，可选P1-01/P1-02蓝、P1-03/P1-04黑；这不是当前主3MF方案，需要另作拆色生产安排。',
 '6. 软料采用厂家支持的送料路径，不默认可进普通AMS。不要用TPU for AMS冒充90A/95A。',
 '7. 提供最终切片截图、每板件数、耗材克数、支撑/清洗用量、时长和实物色卡后报价。',
 '8. 交付前核对35件齐套、左右件、软硬材料、孔槽和配合面。实物装配及行走需另验。','',
 '验证：ZIP CRC通过；包内64个成员齐全；仅Metadata/project_settings.config的两个颜色字段改变；所有网格字节完全一致。',
 '未验证：Bambu Studio重新打开/切片（本机未安装）、G-code、实打、装配、行走、批次色差、95A替代。',
 '3MF旧缩略图和原yellow pla板名仍保留，可能显示原橙/白色。以真实材料槽和本包新图为准。',
 '几何图由原网格+component/build变换计算，照片仅交叉核对。旧对话助手内容为占位引用，无法完整还原此前配色细节。','',
 '文件说明：',
 'XGO_Duck_DeepSeek_preserve_TPU90A.3mf：仅改颜色，保留原材料与打印结构，可在Bambu Studio继续编辑。',
 'XGO_Duck_V2_original.3mf：上传原文件，逐字节备份。',
 'XGO_Duck_DeepSeek_printing_guide.pdf：10页逐板标注册、材料及采购清单。',
 'Plate_1至6_annotated.png：对应PDF中第2至7页，可单独发给商家。',
 'BOM_and_all_source_parameters.json：35个实例和所有原工程参数，可编辑的数据清单；编辑JSON不会自动写回3MF。',
 'verification.json：实际执行的检查、原/改文件SHA-256和未执行项。',
 'Source_embedded_description.txt：原3MF内嵌说明的纯文本抽取。','',
 '来源：用户上传XGO_duckV2.3mf及其中的3D/3dmodel.model、Metadata/model_settings.config、project_settings.config。']
lines += [label+': '+url for label,url in links]
(OUT/'BOM_and_shop_instructions.txt').write_text('\n'.join(lines),encoding='utf-8')
shutil.copy2(ROOT/'work'/'source_description.txt',OUT/'Source_embedded_description.txt')
print('Created PDF and complete plain-text BOM:',PDF)
