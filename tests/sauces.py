"""Materiales de salsa: biblioteca, recoloración, vistas y exportación real."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import os, json
OUT=Path('test-results'); OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('MISE_URL','http://127.0.0.1:4173'))
 page.get_by_role('button',name='O explorar un emplatado de ejemplo').click()
 page.get_by_role('button',name='Salsas y formas',exact=True).click()
 assert page.locator('.painted-sauce').count()==5
 for name in ['Punto de salsa','Base de crema','Línea','Forma circular']:
  page.get_by_role('button',name='Añadir '+name,exact=True).click()
 page.get_by_role('button',name='Guardar',exact=True).click()
 expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador')
 data=page.evaluate("JSON.parse(localStorage.getItem('mise-en-place.projects.v1'))[0]")
 data['name']='Salsas ilustradas'
 data['items']=[i for i in data['items'] if i['kind'] in ['dot','stroke','base','line','circle']]
 for i,(x,z,w,d) in zip(data['items'],[(-35,-55,105,27),(65,-50,45,45),(-50,20,80,60),(40,30,100,10),(10,85,45,45)]):
  i.update(x=x,z=z,width=w,depth=d,rotation=0)
 page.evaluate('(p)=>localStorage.setItem("mise-en-place.projects.v1",JSON.stringify([p]))',data)
 page.reload();page.get_by_role('button',name='Abrir Salsas ilustradas',exact=True).click()
 page.get_by_role('button',name='Salsas y formas',exact=True).click()
 assert page.request.get('http://127.0.0.1:4173/art/sauce-materials.png').ok
 page.wait_for_timeout(1200)
 def preview():
  page.get_by_role('button',name='Exportar',exact=True).click()
  img=page.get_by_alt_text('Vista previa exacta del emplatado a exportar');expect(img).to_be_visible()
  return img.get_attribute('src')
 before=preview()
 with page.expect_download() as download:page.get_by_role('button',name='Descargar PDF',exact=True).click()
 download.value.save_as(OUT/'salsas.pdf');assert (OUT/'salsas.pdf').read_bytes().startswith(b'%PDF')
 page.get_by_role('button',name='Seleccionar Trazo de salsa',exact=True).click()
 page.get_by_label('Color del ingrediente',exact=True).evaluate("el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'#428a38');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}")
 after=preview();assert before!=after
 page.get_by_role('button',name='Imagen PNG',exact=True).click()
 with page.expect_download() as download:page.get_by_role('button',name='Descargar PNG',exact=True).click()
 download.value.save_as(OUT/'salsas.png');assert (OUT/'salsas.png').read_bytes().startswith(b'\x89PNG')
 page.screenshot(path=str(OUT/'salsas-editor.png'))
 page.get_by_role('button',name='Perspectiva',exact=True).click();page.wait_for_timeout(300)
 page.screenshot(path=str(OUT/'salsas-perspectiva.png'))
 assert not errors,errors
 b.close();print('PASS: cinco salsas ilustradas, color editable, cenital/perspectiva, PNG y PDF.')
