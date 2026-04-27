import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Checks whether xelatex is available in PATH.
 * Returns true/false — does NOT exit; caller decides.
 */
export function checkXelatex() {
  try {
    execSync('xelatex --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compiles latexCode to PDF at outputPath.
 * Throws an Error (with LaTeX log excerpt) on failure.
 */
export function compileLatex(latexCode, outputPath) {
  const tempDir = fs.mkdtempSync('/tmp/lab-graph-');
  const texPath = path.join(tempDir, 'graph.tex');

  fs.writeFileSync(texPath, latexCode, 'utf-8');

  try {
    execSync('xelatex -interaction=nonstopmode graph.tex', {
      cwd: tempDir,
      stdio: 'pipe',
    });

    const pdfPath = path.join(tempDir, 'graph.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error('xelatex ran but no PDF was produced.');
    }

    fs.copyFileSync(pdfPath, outputPath);
    return true;
  } catch (err) {
    // Try to surface the relevant part of the LaTeX log
    const logPath = path.join(tempDir, 'graph.log');
    let hint = '';
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf-8');
      const errorLines = log
        .split('\n')
        .filter(l => l.startsWith('!') || l.startsWith('l.'))
        .slice(0, 6)
        .join('\n');
      if (errorLines) hint = `\nLaTeX errors:\n${errorLines}`;
    }
    throw new Error(`Compilation failed: ${err.message}${hint}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
