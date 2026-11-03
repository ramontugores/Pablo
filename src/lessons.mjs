// Each pair is one short session. French dialogue and Spanish observation criteria.
export const lessons = [
 ['Lire une expression','Que représente 4n si n est le nombre de billes dans un sachet ? Dessine ou décris une situation.','Combien de sachets imagines-tu ?','Et si chaque sachet contenait deux billes ?','¿Distingue cuatro grupos de añadir cuatro unidades?'],
 ['Donner une valeur','Si a vaut 3, que vaut 2a + 1 ? Écris ton premier calcul.','Où placerais-tu le 3 dans ton écriture ?','Que ferais-tu en premier avec deux sachets et une bille isolée ?','Observar la sustitución y el orden de las operaciones.'],
 ['Développer','Développe 7(a + 3). Explique ce que multiplie le 7.','Que contient chacun des sept paquets ?','Dessine deux colonnes pour séparer les deux sortes de contenu.','Comprobar si aplica el factor a ambos términos.'],
 ['Garder le signe','Développe 4(2 − x). Où intervient la soustraction ?','À quoi ressembleraient quatre copies de la parenthèse ?','Essaie x = 1 dans les deux écritures. Que remarques-tu ?','Comprobar qué sucede con el signo al distribuir.'],
 ['Repérer un facteur','Écris 5a + 5b sous forme de produit. Comment as-tu choisi le facteur ?','Quel nombre apparaît dans les deux termes ?','Comment vérifier ton produit en le développant ?','Observar si reconoce y justifica el factor común.'],
 ['Inverser le geste','Factorise 18 − 9x en utilisant 9. Explique ce qui reste dans la parenthèse.','Combien de groupes de neuf vois-tu dans chaque terme ?','Le signe change-t-il quand on regroupe ?','Revisar el cociente de cada término y el signo.'],
 ['Réunir des termes','Réduis 13x + x. Comment comptes-tu le dernier x ?','Représente un x par un jeton.','Que représente un jeton posé tout seul ?','Observar si reconoce el coeficiente implícito.'],
 ['Comparer','Peut-on réunir 3a + 2b en un seul terme comme dans 3a + 2a ? Pourquoi ?','Les deux lettres doivent-elles toujours avoir la même valeur ?','Choisis des valeurs différentes pour les deux lettres.','Buscar una explicación de por qué se agrupan términos semejantes.'],
 ['Trois termes','Développe 5(2 + a − b). Comment gardes-tu la trace des termes ?','Combien de termes vois-tu entre les parenthèses ?','Indique le signe de chaque terme avant de multiplier.','Observar cómo organiza varios pasos.'],
 ['Chercher une erreur','Lina propose 3(y + 1) = 3y + 1. Comment pourrais-tu tester son idée ?','Choisis une valeur simple de y.','Calcule les deux côtés séparément. Que compares-tu ?','Observar si usa un contraejemplo y explica su alcance.'],
 ['Calcul astucieux','Comment calculer 23,7 × 7 + 23,7 × 3 sans poser les deux produits ?','Quelle quantité retrouves-tu deux fois ?','Comment compter les groupes en une seule fois ?','Reconocer la factorización en un cálculo numérico.'],
 ['Modéliser','Une boîte contient x crayons bleus et deux rouges. Écris de deux façons le nombre de crayons dans six boîtes.','Que comptes-tu si tu commences par une boîte ?','Et si tu comptes d’abord tous les crayons bleus ?','Relacionar dos expresiones con la misma situación.'],
 ['Retrouver une méthode','Sans regarder tes essais précédents, développe 6(t − 2). Comment vérifierais-tu ?','Que répètes-tu six fois ?','Choisis une valeur de t pour comparer tes écritures.','Contrastar con la distribución con signo de la sesión 2.'],
 ['Inventer','Invente un problème qui se traduit par 4x + 12. Comment le raconterais-tu avec quatre groupes identiques ?','Que pourrait représenter x dans ton histoire ?','Comment répartir la partie fixe entre les groupes ?','Valorar si transfiere la factorización a un problema propio.']
];
export function promptFor(item, first) {
 const [, ,hint, check] = lessons[item];
 if (first.confidence === 0 || /je ne sais|bloqu/i.test(first.answer)) return 'Commence par une petite étape. ' + hint;
 if (item === 2 && /^7a\+3$/i.test(first.answer.replaceAll(' ',''))) return 'Dans ton écriture, combien de fois as-tu compté les trois unités ?';
 return first.confidence === 2 ? check : hint;
}
