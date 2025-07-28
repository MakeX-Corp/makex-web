import subprocess
from chonkie import CodeChunker, SemanticChunker
import json
import sys

def main(url, chunk_type, language="typescript"):
    # Download the file using curl
    result = subprocess.run(["curl", "-s", url], capture_output=True, text=True)
    text = result.stdout

    if chunk_type == "code":
        # Initialize CodeChunker for code with specified language
        chunker = CodeChunker(
            language=language,                    # Use the specified language
            tokenizer_or_token_counter="gpt2",   # Use "gpt2" tokenizer
            chunk_size=8192,
            include_nodes=False
        )
    elif chunk_type == "docs":
        # Initialize SemanticChunker for documentation
        chunker = SemanticChunker(
            embedding_model="minishlab/potion-base-8M",  # Default model
            threshold=0.5,                               # Similarity threshold (0-1) or (1-100) or "auto"
            chunk_size=8192,                            # Maximum tokens per chunk
            min_sentences=1                             # Initial sentences per chunk
        )
    else:
        raise ValueError("chunk_type must be either 'code' or 'docs'")

    chunks = chunker.chunk(text)

    # run a for loop to check if the chunk is too long if it is skip it no print and dont add it to athe output
    output = []
    for chunk in chunks:
        if chunk.token_count > 8192:
            continue  # Skip chunks that are too long
        output.append({
            "text": chunk.text,
            "token_count": chunk.token_count,
        })
    print(json.dumps(output))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python chunk-runner.py <url> <chunk_type> [language]")
        print("  chunk_type: 'code' or 'docs'")
        print("  language: optional, defaults to 'typescript' (only used for code chunking)")
        sys.exit(1)
    
    url = sys.argv[1]
    chunk_type = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else "typescript"
    
    main(url, chunk_type, language)