import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Estado = 'Activo' | 'Inactivo';
interface CodeRange { inicio: string; fin: string; estado: Estado; actualizado: string; }
interface Anaquel { id: number; nombre: string; rango: CodeRange }
interface Estante { id: number; nombre: string; rango: CodeRange; anaqueles: Anaquel[] }
interface Mueble { id: number; nombre: string; rango: CodeRange; estantes: Estante[] }

@Component({
  selector: 'app-admin-ranges-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ranges-config.html',
  styleUrl: './ranges-config.css'
})
export class AdminRangesConfigComponent {
  data: Mueble[] = [
    {
      id: 1, nombre: 'Mueble 1', rango: { inicio: 'A100', fin: 'A199', estado: 'Activo', actualizado: new Date().toLocaleDateString() },
      estantes: [
        { id: 1, nombre: 'Estante 1', rango: { inicio: 'A100', fin: 'A149', estado: 'Activo', actualizado: new Date().toLocaleDateString() }, anaqueles: [
          { id: 1, nombre: 'Anaquel 1', rango: { inicio: 'A100', fin: 'A124', estado: 'Activo', actualizado: new Date().toLocaleDateString() } },
          { id: 2, nombre: 'Anaquel 2', rango: { inicio: 'A125', fin: 'A149', estado: 'Activo', actualizado: new Date().toLocaleDateString() } },
        ] },
        { id: 2, nombre: 'Estante 2', rango: { inicio: 'A150', fin: 'A199', estado: 'Activo', actualizado: new Date().toLocaleDateString() }, anaqueles: [
          { id: 1, nombre: 'Anaquel 1', rango: { inicio: 'A150', fin: 'A174', estado: 'Activo', actualizado: new Date().toLocaleDateString() } },
          { id: 2, nombre: 'Anaquel 2', rango: { inicio: 'A175', fin: 'A199', estado: 'Activo', actualizado: new Date().toLocaleDateString() } },
        ] }
      ]
    },
    {
      id: 2, nombre: 'Mueble 2', rango: { inicio: 'B200', fin: 'B299', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() },
      estantes: [
        { id: 1, nombre: 'Estante 1', rango: { inicio: 'B200', fin: 'B249', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() }, anaqueles: [
          { id: 1, nombre: 'Anaquel 1', rango: { inicio: 'B200', fin: 'B224', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() } },
          { id: 2, nombre: 'Anaquel 2', rango: { inicio: 'B225', fin: 'B249', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() } },
        ] },
        { id: 2, nombre: 'Estante 2', rango: { inicio: 'B250', fin: 'B299', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() }, anaqueles: [
          { id: 1, nombre: 'Anaquel 1', rango: { inicio: 'B250', fin: 'B274', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() } },
          { id: 2, nombre: 'Anaquel 2', rango: { inicio: 'B275', fin: 'B299', estado: 'Inactivo', actualizado: new Date().toLocaleDateString() } },
        ] }
      ]
    }
  ];
  seleccionado: { mueble?: Mueble; estante?: Estante } = {};
  vista: 'muebles' | 'estantes' | 'anaqueles' = 'muebles';

  get titulo(): string {
    if (this.vista === 'muebles') return 'Muebles';
    if (this.vista === 'estantes') return 'Estantes';
    return 'Anaqueles';
  }
  get subtitulo(): string {
    if (this.vista === 'muebles') return '';
    // Mostrar solo el nombre real para evitar duplicación como "Mueble Mueble 1"
    if (this.vista === 'estantes' && this.seleccionado.mueble) return `${this.seleccionado.mueble.nombre}`;
    if (this.vista === 'anaqueles' && this.seleccionado.estante) return `${this.seleccionado.mueble?.nombre} · ${this.seleccionado.estante.nombre}`;
    return '';
  }

  seleccionarMueble(m: Mueble){ this.seleccionado = { mueble: m }; this.vista = 'estantes'; }
  seleccionarEstante(e: Estante){ this.seleccionado = { mueble: this.seleccionado.mueble, estante: e }; this.vista = 'anaqueles'; }
  volverArriba(){ if(this.vista==='anaqueles'){ this.vista='estantes'; this.seleccionado.estante=undefined; } else if(this.vista==='estantes'){ this.vista='muebles'; this.seleccionado={}; } }

  guardarRango(r: CodeRange){ if(!this.valido(r.inicio) || !this.valido(r.fin)) return; r.actualizado = new Date().toLocaleString(); }
  valido(code: string){ return /^[A-Za-z]{1,2}\d{2,4}$/.test(code); }
}