# Script Python para detectar BPM preciso de arquivos de áudio
import sys
import json
import os

try:
    import librosa
    import numpy as np
except ImportError:
    print(json.dumps({"error": "librosa not installed", "success": False}))
    sys.exit(1)

def detect_bpm_precise(audio_path):
    """
    Detecta BPM de forma precisa usando análise de batidas
    """
    try:
        # Carregar áudio
        y, sr = librosa.load(audio_path, duration=120)  # Analisar primeiros 2 minutos
        
        # Método 1: Detecção de tempo global
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Método 2: Análise de onset (início de notas/batidas)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempogram = librosa.feature.tempogram(onset_envelope=onset_env, sr=sr)
        
        # Obter BPM mais provável
        bpm = int(round(tempo))
        
        # Validar range
        if 60 <= bpm <= 200:
            return {
                "bpm": bpm,
                "confidence": "high",
                "success": True,
                "method": "librosa beat tracking"
            }
        else:
            # Se fora do range, tentar ajustar (pode ser metade ou dobro)
            if bpm < 60:
                bpm = bpm * 2
            elif bpm > 200:
                bpm = bpm // 2
            
            if 60 <= bpm <= 200:
                return {
                    "bpm": bpm,
                    "confidence": "medium",
                    "success": True,
                    "method": "librosa beat tracking (adjusted)"
                }
            else:
                return {"success": False, "error": "BPM out of valid range"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file provided", "success": False}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    if not os.path.exists(audio_path):
        print(json.dumps({"error": "File not found", "success": False}))
        sys.exit(1)
    
    result = detect_bpm_precise(audio_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
