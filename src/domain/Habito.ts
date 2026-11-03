export interface Habito { id: number; nombre: string; descripcion?: string | null; estado: string; frecuencia: string }
export interface HabitoInput { nombre: string; descripcion: string; estado: string; frecuencia: string }
export interface HabitoRepository { listar(admin?: boolean): Promise<Habito[]>; obtener(id: number): Promise<Habito>; crear(input: HabitoInput): Promise<void>; actualizar(id: number, input: HabitoInput): Promise<void>; eliminar(id: number): Promise<void> }

