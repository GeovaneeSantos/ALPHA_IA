import io
import torch as to
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify

device = to.device('cuda' if to.cuda.is_available() else 'cpu')
tamanho_padrão = (224,224)
transformações = transforms.Compose([transforms.Resize(tamanho_padrão),
transforms.ToTensor(), transforms.Normalize(mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225])])

class SEBlock(nn.Module):
    def __init__(self, channels, reduction=16):
        super(SEBlock, self).__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction),
            nn.ReLU(),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y

class IA(nn.Module):
  def __init__(self, num_class = 16):
    super().__init__()
    self.num_class  = num_class
    self.entrada = nn.Sequential(nn.Conv2d(in_channels = 3,out_channels = 32, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(32),
    nn.ReLU(),

    nn.Conv2d(in_channels = 32, out_channels = 32, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(32),
    nn.ReLU(),

    SEBlock(32),
    nn.MaxPool2d(kernel_size = 2, stride = 2),
    nn.Conv2d(in_channels = 32, out_channels = 64, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(64),
    nn.ReLU(),
    nn.Conv2d(in_channels = 64, out_channels = 64, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(64),
    nn.ReLU(),
    SEBlock(64),
    nn.MaxPool2d(kernel_size = 2, stride = 2),
    nn.Conv2d(in_channels = 64, out_channels = 128, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(128),
    nn.ReLU(),
    nn.Conv2d(in_channels = 128, out_channels = 128, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(128),
    nn.ReLU(),
    SEBlock(128),
    nn.MaxPool2d(kernel_size = 2, stride = 2),
    nn.Conv2d(in_channels = 128, out_channels = 256, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(256),
    nn.ReLU(),
    nn.Conv2d(in_channels = 256, out_channels = 256, kernel_size = 3, stride = 1, padding = 1),
    nn.BatchNorm2d(256),
    nn.ReLU(),
    SEBlock(256),
    nn.MaxPool2d(kernel_size = 2, stride = 2))

    self.adaptação_de_imagem = nn.AdaptiveAvgPool2d((1,1))
    self.Flatten = nn.Flatten(1)
    self.camada_escondida = nn.Sequential(nn.Linear(in_features = 256, out_features = 256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(in_features = 256, out_features = 128),
    nn.ReLU(),
    nn.Dropout(0.3))
    self.saída = nn.Linear(in_features = 128, out_features = self.num_class)

  def forward(self,x):
    saida = self.entrada(x)
    saida = self.adaptação_de_imagem(saida)
    saida = self.Flatten(saida)
    saida = self.camada_escondida(saida)
    saida = self.saída(saida)
    return saida

caminho_do_modelo = "modelo_de_IA50.pth"
modelo20 = IA()
modelo20.load_state_dict(to.load(caminho_do_modelo, map_location=to.device('cpu')))
modelo20.to(device)
modelo20.eval()

classes = [
    "Caixa de Som",
    "Capacitor",
    "Controle Remoto",
    "Desktop",
    "Headphone",
    "Laptop",
    "LED",
    "Microfone",
    "Moldem",
    "Monitor",
    "Notebook",
    "Relógio Analógico",
    "Relógio Digital",
    "Resistor",
    "Teclado",
    "Transistor"
]

app = Flask(__name__)

def classificador_de_imagem(caminho_imagem):
    print(f'Classificando a imagem: {caminho_imagem}')  
    try:
        img = Image.open(caminho_imagem).convert('RGB')
        img_tensor = transformações(img).unsqueeze(0).to(device)
        with to.no_grad():
            saída2 = modelo20(img_tensor)
            _, índice_da_predição = to.max(saída2, 1)
            índice_classe = índice_da_predição.item()
            print("A classe é {}".format(classes[índice_classe]))

    except FileNotFoundError:
        print(f"Erro: Arquivo não encontrado no caminho especificado: {caminho_imagem}")

def classificador_de_imagem_bytes(conteúdo_arquivo):

    img = Image.open(io.BytesIO(conteúdo_arquivo)).convert('RGB')
    img_tensor = transformações(img).unsqueeze(0).to(device)

    with to.no_grad():
        saída2 = modelo20(img_tensor)
        _, índice_da_predição = to.max(saída2, 1)
        índice_classe = índice_da_predição.item()
    return classes[índice_classe]

@app.route('/api/classificar', methods=['POST'])
def classificar_imagem():
    if 'imagem' not in request.files:
        return jsonify({'erro': 'Nenhuma imagem enviada no campo "imagem"'}), 400
    arquivo_imagem = request.files['imagem']
    if arquivo_imagem.filename == '':
        return jsonify({'erro': 'Nome de arquivo inválido'}), 400
    if arquivo_imagem:
        try:
            conteúdo_arquivo = arquivo_imagem.read()
            resultado_classe = classificador_de_imagem_bytes(conteúdo_arquivo)
            return jsonify({'classe_predita': resultado_classe}), 200
        except Exception as e:
            return jsonify({'erro': f'Erro interno durante a classificação: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)