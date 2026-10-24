import pandas as pd
import os

def limpar_contatos(input_file="../public/data/contatosEmpresas.csv", output_file="contatosEmpresas_limpo.csv"):
    if not os.path.exists(input_file):
        print(f"❌ Erro: O arquivo '{input_file}' não foi encontrado na raiz.")
        return

    print(f"🔄 Lendo o arquivo '{input_file}'...")
    # Lendo o CSV (ajuste o sep=';' se o seu CSV usar ponto e vírgula)
    df = pd.read_csv(input_file, sep=',')

    total_original = len(df)

    # Remove linhas onde AMBOS 'Email' e 'Número' estão vazios (NaN ou nulos)
    # subset determina quais colunas olhar; how='all' significa deletar apenas se TODAS do subset forem nulas
    df_limpo = df.dropna(subset=['Email', 'Número'], how='all')
    
    # Remove também linhas que possam ter apenas espaços em branco nestes campos
    df_limpo = df_limpo[
        (df_limpo['Email'].astype(str).str.strip() != '') | 
        (df_limpo['Número'].astype(str).str.strip() != '')
    ]

    total_limpo = len(df_limpo)
    linhas_removidas = total_original - total_limpo

    # Salva o novo arquivo
    df_limpo.to_csv(output_file, index=False, sep=',')
    
    print("✅ Processo concluído com sucesso!")
    print(f"📊 Total original: {total_original} linhas")
    print(f"🧹 Linhas removidas: {linhas_removidas}")
    print(f"💾 Arquivo limpo salvo como: '{output_file}'")

if __name__ == "__main__":
    limpar_contatos()
