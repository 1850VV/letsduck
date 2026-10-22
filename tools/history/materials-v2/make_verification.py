from pathlib import Path
import json,zipfile,hashlib
root=Path('outputs/duck-color-studio')
def cli_result(path):
 text=Path(path).read_text();return json.loads(text.split('### Result\n',1)[1].split('\n###',1)[0])
ui=cli_result('work/materials-v2/ui-check-result.txt');migration=cli_result('work/materials-v2/migration-check-result.txt')
assert all(x['pass'] for x in ui+migration)
native=json.loads(Path('work/materials-v2/native-validation.json').read_text())
source=(root/'assets/source.3mf').read_bytes();example=Path('outputs/XGO_Duck_Blue_White_Black_materials.3mf');z=zipfile.ZipFile(example)
manifest=json.loads(z.read('Metadata/duck_studio_materials.json'))
original=zipfile.ZipFile(root/'assets/source.3mf');mesh_names=[n for n in original.namelist() if n.startswith('3D/')]
assert all(original.read(n)==z.read(n) for n in mesh_names)
criteria=[
 {'criterion':'具体 PLA / TPU 产品库与产品色号','status':'passed','evidence':'官方固定提交 SHA 色表，30 PLA Basic + 6 TPU 90A；页面按原材料系列过滤；快照散列已与官方提交比对。'},
 {'criterion':'逐零件改色、配对、方案对比、撤销与保存','status':'passed','evidence':'22 项浏览器流程检查全部通过，含实际下载 4 槽与 8 槽 3MF、BOM。'},
 {'criterion':'已有原型配色保留','status':'passed','evidence':'5 项 v1→v2 迁移检查通过；未匹配目标色保留原色，不虚构产品。用户现有草稿在应用浏览器中仍显示。'},
 {'criterion':'导出改色后的可编辑 3MF','status':'passed','evidence':'浏览器真实下载；原生 Bambu Studio 02.08.02.61 CLI 对 4/8/16 槽项目读入及重新保存均退出 0；35 个 UUID 的有效耗材分配完全一致。'},
 {'criterion':'保留尺寸、打印板、对象与原材料参数','status':'passed','evidence':f'{len(mesh_names)} 个 3D/ 条目字节完全相同；6 板、25 对象、35 实例；非耗材对象元数据一致。新增槽按源材料模板复制。原生读写后原有 581 个配置字段值一致。'},
 {'criterion':'原生切片和实际打印','status':'not_executed','evidence':'未生成 G-code，未连接打印机；需复核多色换料、TPU 分批安排及冲刷量。'},
 {'criterion':'实时库存、价格、实物色差','status':'not_in_scope','evidence':'库为官方产品色表快照，屏幕和透明度仅供预览；未接商品库存服务或实物色彩测量。'},
 {'criterion':'MCP','status':'deferred','evidence':'按用户分阶段要求，本轮未接入。'}]
report=dict(version='2.0.0',checkedAt='2026-10-22',source_sha256=hashlib.sha256(source).hexdigest(),example_sha256=hashlib.sha256(example.read_bytes()).hexdigest(),acceptanceCriteria=criteria,unitTests={'command':'python3 -m unittest discover -s tests -v','count':8,'passed':8},browserTests=ui,migrationTests=migration,bambuRoundTrips=native,baselineExportValidation=manifest['validation'],nativeWarnings=['原始文件与本次文件的 CLI 检查均出现缺少独立 machine_full/process_full 预设目录、no filament colors found in projects 和 nozzle list 建立警告。嵌入配置读写保留且有效分配核验通过；未据此宣称切片就绪。'],resolvedIssues=[{'issue':'首次导出测试发生 BadZipFile: Bad magic number for file header','cause':'重用 ZipInfo 写入修改了源 ZIP 的目录偏移','fix':'写入前复制每个 ZipInfo；重复导出和 8 项测试已通过。'},{'issue':'首次原生 8 槽回读有 2 个单零件对象退回旧耗材槽','cause':'Bambu Studio 单零件对象优先对象级 extruder','fix':'同时写对象和零件级分配；原生 4/8/16 槽的 35 个有效分配全部一致。'}],sliced=False,physicalPrintVerified=False,userAcceptanceOfThisPhase='pending review')
(root/'verification-materials.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# Keep the existing generic report as an index, preserving the prior prototype record.
old=json.loads((root/'verification.json').read_text())
(root/'verification.json').write_text(json.dumps({'current':'verification-materials.json','version':'2.0.0','prototypeVerification':old},ensure_ascii=False,indent=2))
text='Duck Studio 耗材版 · 验证记录（2026-10-22）\n\n'
for c in criteria:text+=f"{c['criterion']}：{c['status']}\n{c['evidence']}\n\n"
text+='导出器测试：8/8 通过。浏览器流程：22/22 通过。草稿迁移：5/5 通过。\n'
text+='原生 Bambu Studio：4、8、16 槽均读入并重新保存成功。35 个零件有效分配一致，原有 581 项配置值一致。\n'
text+='原生软件另补 inherits_group 与 filament_map_2 两项系统元数据，交付文件不是原生重存副本，而是保留源网格的工作台直接导出。\n\n'
text+='已修复测试中发现的问题：ZIP 目录对象复用导致连续导出失败；单零件对象颜色继承导致两只脚使用旧槽。对应测试和原生回读均已重新通过。\n\n'
text+='未验证：实际打印、切片结果、实物色差、运动与装配公差。原生 CLI 警告和原始源文件一致，详见 JSON。\n'
text+='这份结果证明实现和文件读写已通过检查；本轮用户实际使用验收仍待反馈。\n'
(root/'verification-materials.txt').write_text(text)
print('Report written:',len(ui)+len(migration),'browser checks;',len(native),'native round trips')
