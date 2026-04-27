import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function compileLatex(latexCode, outputPath) {
  const tempDir = fs.mkdtempSync('/tmp/lab-graph-');
  const texPath = path.join(tempDir, 'graph.tex');

  fs.writeFileSync(texPath, latexCode);

  try {
    execSync(`cd ${tempDir} && xelatex -interaction=nonstopmode graph.tex`, {
      stdio: 'pipe',
    });

    const pdfPath = path.join(tempDir, 'graph.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.copyFileSync(pdfPath, outputPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Compilation error:', error.message);
    return false;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}