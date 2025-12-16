import json
import struct
import sys

def read_glb_chunk(f):
    chunk_len_bytes = f.read(4)
    if not chunk_len_bytes: return None, None
    chunk_len = struct.unpack('<I', chunk_len_bytes)[0]
    chunk_type = f.read(4).decode('utf-8')
    chunk_data = f.read(chunk_len)
    return chunk_type, chunk_data

def inspect_glb(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a GLB file")
            return
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        while True:
            ctype, cdata = read_glb_chunk(f)
            if ctype == 'JSON':
                data = json.loads(cdata)
                if 'nodes' in data:
                    print("Nodes:")
                    for i, n in enumerate(data['nodes']):
                        print(f"  {i}: {n.get('name', 'unnamed')} (Mesh: {n.get('mesh')})")
                if 'meshes' in data:
                    print("Meshes:")
                    for i, m in enumerate(data['meshes']):
                        print(f"  {i}: {m.get('name', 'unnamed')}")
                break
            if not ctype: break

inspect_glb('public/models/soldier.glb')
