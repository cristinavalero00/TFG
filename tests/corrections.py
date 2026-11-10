"""Regresión de tiradores, superposición, armonías dinámicas y materiales."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import os,json,base64,hashlib
OUT=Path('test-results');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000},accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('MISE_URL','http://127.0.0.1:5173'));page.get_by_role('button',name='O explorar un emplatado de ejemplo').click();expect(page.locator('canvas')).to_be_visible();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();page.wait_for_timeout(1300)
 def value(label):return float(page.get_by_label(label,exact=True).input_value())
 def drag_handle(name,dx,dy,cancel=False):
  h=page.get_by_role('button',name='Redimensionar '+name,exact=True);r=h.bounding_box();assert r,name
  page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down();page.mouse.move(r['x']+r['width']/2+dx,r['y']+r['height']/2+dy,steps=8)
  if cancel:page.keyboard.press('Escape')
  page.mouse.up();page.wait_for_timeout(180)
 assert page.locator('.resize-handle:visible').count()==8
 w,d=value('Ancho'),value('Fondo');drag_handle('inferior',0,36);assert value('Ancho')==w;assert value('Fondo')>d+8
 w,d=value('Ancho'),value('Fondo');drag_handle('derecha',36,0);assert value('Ancho')>w+8;assert value('Fondo')==d
 w,d=value('Ancho'),value('Fondo');drag_handle('inferior derecha',30,30);assert abs(value('Ancho')/value('Fondo')-w/d)<.01
 w,d=value('Ancho'),value('Fondo');drag_handle('superior izquierda',-35,-25,True);assert value('Ancho')==w and value('Fondo')==d
 # Rotated resize frame remains operable.
 rotation=page.get_by_label('Rotación',exact=True);rotation.fill('45');rotation.press('Tab');w=value('Ancho');drag_handle('derecha',25,25);assert value('Ancho')>w
 # Locked and perspective objects must not expose resize handles.
 page.get_by_role('button',name='Bloquear Calabacín',exact=True).click();assert page.locator('.resize-handle:visible').count()==0;page.get_by_role('button',name='Desbloquear Calabacín',exact=True).click()
 page.get_by_role('button',name='Perspectiva',exact=True).click();assert page.locator('.resize-handle:visible').count()==0;page.get_by_role('button',name='Cenital',exact=True).click()
 # Also resize sauce along its narrow side.
 page.get_by_role('button',name='Seleccionar Trazo de salsa',exact=True).click();w,d=value('Ancho'),value('Fondo');drag_handle('inferior',0,30);assert value('Ancho')==w and value('Fondo')>d
 # Actual object palette, then update a material and verify recomputed harmonies.
 page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();page.get_by_role('button',name='Guía',exact=True).click();page.get_by_role('button',name='Color',exact=True).click();expect(page.get_by_role('heading',name='Los colores de tu emplatado')).to_be_visible();expect(page.locator('.reference-color')).to_contain_text('#668943');page.get_by_role('button',name='Cerrar guía').click()
 color=page.get_by_label('Color del ingrediente',exact=True)
 color.evaluate("el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'#ff0000');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}")
 page.get_by_role('button',name='Guía',exact=True).click();page.get_by_role('button',name='Color',exact=True).click();expect(page.locator('.reference-color')).to_contain_text('#FF0000');expect(page.locator('.harmony-swatches').last).to_contain_text('#13ECEC');page.get_by_role('button',name='Cerrar guía').click()
 # Construct an old-format project with exact overlap and no depth field.
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador')
 data=page.evaluate("JSON.parse(localStorage.getItem('mise-en-place.projects.v1'))[0]")
 zucchini=next(i for i in data['items'] if i['kind']=='zucchini');carrot=next(i for i in data['items'] if i['kind']=='carrot')
 for i in [zucchini,carrot]:i.update(x=0,z=0,rotation=0,elevation=0,color='#668943' if i['kind']=='zucchini' else '#ed942f');i.pop('depth',None)
 data['items']=[zucchini,carrot];data.pop('layerStacking',None);data['name']='Proyecto anterior';data['thumbnail']=None
 page.evaluate('(p)=>localStorage.setItem("mise-en-place.projects.v1",JSON.stringify([p]))',data)
 page.reload();page.get_by_role('button',name='Abrir Proyecto anterior',exact=True).click();expect(page.locator('canvas')).to_be_visible();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();page.wait_for_timeout(500)
 def image_hash():
  page.get_by_role('button',name='Exportar',exact=True).click();img=page.get_by_alt_text('Vista previa exacta del emplatado a exportar');expect(img).to_be_visible();src=img.get_attribute('src');page.get_by_role('button',name='Cancelar',exact=True).click();return hashlib.sha256(src.encode()).hexdigest()
 before=image_hash();page.get_by_role('button',name='Al fondo',exact=True).click();after=image_hash();assert before!=after,'El orden debe cambiar el plato, no solo la lista'
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador');ordered=page.evaluate("JSON.parse(localStorage.getItem('mise-en-place.projects.v1'))[0]");assert ordered['layerStacking'] is True and ordered['items'][0]['id']==zucchini['id']
 page.get_by_role('button',name='Al frente',exact=True).click();front=image_hash();assert front!=after
 # Drag-and-drop uses the same actual stacking semantics.
 source=page.locator('.layer').filter(has=page.get_by_role('button',name='Seleccionar Calabacín',exact=True));target=page.locator('.layer').filter(has=page.get_by_role('button',name='Seleccionar Zanahoria',exact=True));source.drag_to(target);expect(page.locator('.layers .layer').first).to_contain_text('Zanahoria');assert image_hash()!=front
 # Persist changed dimensions and stacking in an editable file.
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador');page.reload();page.get_by_role('button',name='Abrir Proyecto anterior',exact=True).click();expect(page.locator('canvas')).to_be_visible();assert page.locator('.webgl-error').count()==0
 page.screenshot(path=str(OUT/'capas-corregidas.png'))
 assert not errors,errors
 print('PASS: ocho tiradores, fondo independiente, escala proporcional, cancelación, objeto girado, salsa, bloqueo, perspectiva, armonías que se actualizan, capas con cambios visibles por botones y arrastre, y compatibilidad con proyectos anteriores. Sin errores JavaScript.')
 b.close()
