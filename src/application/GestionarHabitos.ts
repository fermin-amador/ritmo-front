import type { HabitoRepository, HabitoInput } from '../domain/Habito';
export class GestionarHabitos {
 constructor(private readonly repository: HabitoRepository) {}
 listar(admin = false) { return this.repository.listar(admin); }
 obtener(id: number) { return this.repository.obtener(id); }
 guardar(input: HabitoInput, id?: number) { if (!input.nombre.trim()) throw new Error('Escribe el nombre de tu hábito.'); return id === undefined ? this.repository.crear(input) : this.repository.actualizar(id, input); }
 eliminar(id: number) { return this.repository.eliminar(id); }
}

