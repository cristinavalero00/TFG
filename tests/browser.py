"""Pruebas funcionales sobre el servidor indicado en MISE_URL (por defecto 127.0.0.1:5173)."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os
OUT=Path('test-results');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('MISE_URL','http://127.0.0.1:5173'));expect(page.get_by_role('heading',name='Mis emplatados.')).to_be_visible()
 page.get_by_role('button',name='Nuevo emplatado',exact=True).click()
 expect(page.locator('canvas')).to_be_visible();expect(page.locator('.webgl-error')).to_have_count(0)
 page.get_by_role('button',name='Ingredientes',exact=True).click()
 page.get_by_role('button',name='Añadir Calabacín',exact=True).click()
 expect(page.get_by_label('Ancho',exact=True)).to_have_value('43')
 width=page.get_by_label('Ancho',exact=True);width.fill('60');width.press('Tab');expect(width).to_have_value('60')
 page.get_by_role('button',name='Deshacer (Ctrl/⌘ + Z)',exact=True).click();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();expect(width).to_have_value('43')
 page.get_by_role('button',name='Rehacer (Ctrl/⌘ + Mayús + Z)',exact=True).click();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();expect(width).to_have_value('60')
 width.fill('-5');width.press('Tab');expect(page.get_by_role('alert')).to_contain_text('Introduce un valor');width.fill('60');width.press('Tab')
 page.get_by_role('button',name='Añadir Brócoli',exact=True).click();page.get_by_role('button',name='Añadir Zanahoria',exact=True).click()
 page.get_by_label('Guía de composición',exact=True).select_option('triangular')
 page.get_by_role('button',name='Huerto de temporada',exact=True).count() # no implicit sample projects
 page.locator('.project-title > button').click();page.get_by_label('Nombre',exact=True).fill('Prueba de composición');page.get_by_role('button',name='Confirmar nombre').click()
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador')
 def saved():return page.evaluate("JSON.parse(localStorage.getItem('mise-en-place.projects.v1'))[0]")
 data=saved();assert len(data['items'])==3 and data['items'][0]['width']==60
 # Drag ingredient in the actual 3D canvas; save and verify its data changed.
 item=data['items'][-1];canvas=page.locator('canvas').bounding_box();scale=canvas['height']/490
 x=canvas['x']+canvas['width']/2+item['x']*scale;y=canvas['y']+canvas['height']/2+item['z']*scale
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+50,y+25,steps=8);page.mouse.up();page.wait_for_timeout(250)
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador');moved=saved()['items'][-1];assert abs(moved['x']-item['x'])>10, (moved,item)
 # camera must not modify composition or dirty flag
 before=json.dumps(saved()['items'],sort_keys=True)
 page.get_by_role('button',name='Perspectiva',exact=True).click();page.get_by_label('Giro de cámara').fill('65');page.get_by_label('Inclinación de cámara').fill('50')
 expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador');assert json.dumps(saved()['items'],sort_keys=True)==before
 page.get_by_role('button',name='Guía',exact=True).click();expect(page.get_by_role('complementary',name='Guía contextual')).to_be_visible();page.get_by_role('button',name='Color',exact=True).click();expect(page.locator('.color-wheel')).to_be_visible();page.get_by_role('button',name='Cerrar guía').click()
 page.get_by_role('button',name='Cenital',exact=True).click();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click()
 page.get_by_role('button',name='Más ajustes',exact=True).click();page.get_by_label('Elevación',exact=True).fill('15');page.get_by_label('Elevación',exact=True).press('Tab')
 page.get_by_role('button',name='Bloquear Calabacín',exact=True).click();expect(width).to_be_disabled();page.get_by_role('button',name='Desbloquear Calabacín',exact=True).click();expect(width).to_be_enabled()
 page.get_by_role('button',name='Ocultar Brócoli',exact=True).click();expect(page.get_by_role('button',name='Mostrar Brócoli',exact=True)).to_be_visible();page.get_by_role('button',name='Mostrar Brócoli',exact=True).click()
 # Export exact image and multi-page PDF.
 page.get_by_role('button',name='Exportar',exact=True).click();expect(page.get_by_alt_text('Vista previa exacta del emplatado a exportar')).to_be_visible()
 page.get_by_label('Notas de montaje (opcional)').fill('Añadir la salsa al final. Conservar la disposición del calabacín.\n'+'Notas de montaje para el pase. '*150)
 with page.expect_download() as d:page.get_by_role('button',name='Descargar PDF',exact=True).click()
 pdf=d.value;pdf.save_as(OUT/'ficha.pdf');assert (OUT/'ficha.pdf').read_bytes().startswith(b'%PDF')
 page.get_by_role('button',name='Exportar',exact=True).click();page.get_by_role('button',name='Imagen PNG',exact=True).click();page.get_by_label('Vista actual',exact=True).check()
 with page.expect_download() as d:page.get_by_role('button',name='Descargar PNG',exact=True).click()
 d.value.save_as(OUT/'composicion.png');assert (OUT/'composicion.png').read_bytes().startswith(b'\x89PNG')
 # Backup is a transportable editable composition.
 with page.expect_download() as d:page.get_by_role('button',name='Descargar copia editable',exact=True).click()
 d.value.save_as(OUT/'copia.mise.json');backup=json.loads((OUT/'copia.mise.json').read_text());assert backup['project']['name']=='Prueba de composición'
 # Storage failure must preserve working scene and keep exit dialog open.
 page.evaluate("() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = function(){throw new DOMException('Quota exceeded','QuotaExceededError')}; }")
 page.get_by_role('button',name='Mis emplatados',exact=True).click();expect(page.get_by_role('dialog')).to_be_visible();page.get_by_role('button',name='Guardar y salir',exact=True).click();expect(page.get_by_role('dialog')).to_contain_text('No se ha podido guardar');expect(page.locator('canvas')).to_be_visible();page.get_by_role('button',name='Seguir editando').click()
 page.evaluate('() => {Storage.prototype.setItem=window.originalSet;}')
 page.get_by_role('button',name='Guardar',exact=True).click();expect(page.locator('.project-title')).to_contain_text('Guardado en este navegador')
 # Persist through full reload.
 page.get_by_role('button',name='Mis emplatados',exact=True).click();expect(page.get_by_role('button',name='Abrir Prueba de composición',exact=True)).to_be_visible();page.reload();page.get_by_role('button',name='Abrir Prueba de composición',exact=True).click();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();expect(width).to_have_value('60');page.get_by_role('button',name='Más ajustes',exact=True).click();expect(page.get_by_label('Elevación',exact=True)).to_have_value('15')
 page.screenshot(path=str(OUT/'editor-cenital.png'),full_page=True)
 page.get_by_role('button',name='Perspectiva',exact=True).click();page.screenshot(path=str(OUT/'editor-perspectiva.png'),full_page=True)
 # Unsaved changes can be discarded explicitly without overwriting saved version.
 width.fill('80');width.press('Tab');page.get_by_role('button',name='Mis emplatados',exact=True).click();page.get_by_role('button',name='Salir sin guardar',exact=True).click();page.get_by_role('button',name='Abrir Prueba de composición',exact=True).click();page.get_by_role('button',name='Seleccionar Calabacín',exact=True).click();expect(width).to_have_value('60')
 page.get_by_role('button',name='Mis emplatados',exact=True).click();page.get_by_role('button',name='Opciones de Prueba de composición').click();page.get_by_role('button',name='Duplicar',exact=True).click();expect(page.get_by_role('button',name='Abrir Copia de Prueba de composición')).to_be_visible()
 page.get_by_role('button',name='Opciones de Copia de Prueba de composición').click();page.get_by_role('button',name='Eliminar',exact=True).click();page.get_by_role('button',name='Eliminar emplatado',exact=True).click();expect(page.get_by_role('button',name='Abrir Copia de Prueba de composición')).to_have_count(0)
 page.screenshot(path=str(OUT/'proyectos.png'),full_page=True)
 # Recover editable archive into a fresh project.
 page.locator('input[type=file]').set_input_files(str(OUT/'copia.mise.json'));expect(page.locator('.project-title')).to_contain_text('Cambios sin guardar');expect(page.get_by_role('button',name='Seleccionar Calabacín',exact=True)).to_be_visible()
 assert not errors,errors
 print('PASS: creación, edición, historial, validación, arrastre 3D, cámara, guías, bloqueo, visibilidad, PDF, PNG, copia editable, error de almacenamiento, protección de salida, persistencia, duplicado, borrado e importación. Sin errores JavaScript.')
 b.close()
