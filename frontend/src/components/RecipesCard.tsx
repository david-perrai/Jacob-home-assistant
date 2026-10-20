import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import RecipeApi, {
  RecipeDetails,
  RecipeKind,
  RecipeSummary,
} from "../api/RecipeApi";

const recipeApi = new RecipeApi();

export default function RecipesCard() {
  const [recipeKinds, setRecipeKinds] = useState<RecipeKind[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<RecipeKind | null>(null);
  const [isLoadingCategoryRecipes, setIsLoadingCategoryRecipes] =
    useState(false);
  const [categoryRecipesError, setCategoryRecipesError] = useState<
    string | null
  >(null);
  const [categoryLoadAttempt, setCategoryLoadAttempt] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(
    null,
  );
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetails | null>(
    null,
  );
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRecipeKinds(await recipeApi.getRecipeCategories());
    } catch (fetchError) {
      console.error(
        "Impossible de récupérer les catégories de recettes",
        fetchError,
      );
      setError("Impossible de charger les catégories de recettes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedKind) {
      setRecipes([]);
      return;
    }

    let isActive = true;
    setIsLoadingCategoryRecipes(true);
    setCategoryRecipesError(null);

    recipeApi
      .getRecipesByKind(selectedKind)
      .then((categoryRecipes) => {
        if (isActive) {
          setRecipes(categoryRecipes);
        }
      })
      .catch((fetchError: unknown) => {
        console.error(
          "Impossible de récupérer les recettes de la catégorie",
          fetchError,
        );
        if (isActive) {
          setCategoryRecipesError(
            "Impossible de charger les recettes de cette catégorie.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingCategoryRecipes(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedKind, categoryLoadAttempt]);

  useEffect(() => {
    if (!selectedRecipe) {
      return;
    }

    let isActive = true;
    setRecipeDetails(null);
    setDetailsError(null);
    setIsLoadingDetails(true);

    recipeApi
      .getRecipe(selectedRecipe.id)
      .then((details) => {
        if (isActive) {
          setRecipeDetails(details);
        }
      })
      .catch((fetchError: unknown) => {
        console.error("Impossible de récupérer la recette", fetchError);
        if (isActive) {
          setDetailsError("Impossible de charger le détail de cette recette.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedRecipe]);

  const closeRecipe = () => {
    setSelectedKind(null);
    setSelectedRecipe(null);
    setRecipeDetails(null);
    setDetailsError(null);
  };

  const goBackToRecipes = () => {
    setSelectedRecipe(null);
    setRecipeDetails(null);
    setDetailsError(null);
  };

  return (
    <>
      <section className="dashboard-card recipes-card">
        <div className="card-header recipes-card-header">
          <span className="icon recipes-header-icon" aria-hidden="true">
            <RestaurantMenuRoundedIcon />
          </span>
          <div>
            <h2>Recettes</h2>
            <p>De quoi vous régaler</p>
          </div>
        </div>
        {isLoading ? (
          <p className="recipe-list-status">Chargement des recettes…</p>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <button
                className="recipe-retry"
                type="button"
                onClick={() => void loadCategories()}
              >
                Réessayer
              </button>
            }
          >
            {error}
          </Alert>
        ) : recipeKinds.length > 0 ? (
          <ul className="recipe-categories">
            {recipeKinds.map((kind) => (
              <li key={kind}>
                <button
                  type="button"
                  className="recipe-list-button recipe-category-button"
                  onClick={() => setSelectedKind(kind)}
                >
                  <span>{kind}</span>
                  <ArrowForwardRoundedIcon aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="recipe-list-status">Aucune recette enregistrée</p>
        )}
      </section>

      <Dialog
        open={selectedKind !== null}
        onClose={closeRecipe}
        fullWidth
        maxWidth="sm"
        className="app-dialog"
        aria-labelledby="recipe-dialog-title"
      >
        <div className="recipe-dialog-heading">
          {selectedRecipe && (
            <IconButton
              aria-label="Retour à la liste des recettes"
              onClick={goBackToRecipes}
              className="recipe-back-button"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <h2 id="recipe-dialog-title">
            {selectedRecipe
              ? (recipeDetails?.name ?? selectedRecipe.name)
              : selectedKind}
          </h2>
          <IconButton
            aria-label="Fermer la fenêtre des recettes"
            onClick={closeRecipe}
            className="recipe-close-button"
          >
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
        <DialogContent dividers className="recipe-dialog-content">
          {!selectedRecipe && isLoadingCategoryRecipes ? (
            <div className="recipe-details-loading">
              <CircularProgress
                size={28}
                aria-label="Chargement des recettes"
              />
            </div>
          ) : !selectedRecipe && categoryRecipesError ? (
            <Alert
              severity="error"
              action={
                <button
                  className="recipe-retry"
                  type="button"
                  onClick={() =>
                    setCategoryLoadAttempt((attempt) => attempt + 1)
                  }
                >
                  Réessayer
                </button>
              }
            >
              {categoryRecipesError}
            </Alert>
          ) : !selectedRecipe && recipes.length === 0 ? (
            <div className="recipe-empty-state">
              <span className="recipe-empty-icon" aria-hidden="true">
                <RestaurantMenuRoundedIcon />
              </span>
              <p className="recipe-list-status">
                Aucune recette dans cette catégorie
              </p>
              <span>Les nouvelles idées gourmandes apparaîtront ici.</span>
            </div>
          ) : !selectedRecipe ? (
            <ul className="recipe-list">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    className="recipe-list-button"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    {recipe.name}
                    <ArrowForwardRoundedIcon aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : isLoadingDetails ? (
            <div className="recipe-details-loading">
              <CircularProgress
                size={28}
                aria-label="Chargement de la recette"
              />
            </div>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : recipeDetails ? (
            <div className="recipe-details">
              <p className="recipe-servings">
                Pour {recipeDetails.numberOfServings}{" "}
                {recipeDetails.numberOfServings > 1 ? "personnes" : "personne"}
              </p>
              <section aria-labelledby="recipe-ingredients-heading">
                <h3 id="recipe-ingredients-heading">Ingrédients</h3>
                <ul>
                  {recipeDetails.ingredients.map((ingredient, index) => (
                    <li key={`${ingredient.name}-${index}`}>
                      <span>{ingredient.name}</span>
                      <strong>
                        {ingredient.quantity.toLocaleString("fr-FR")}
                        {ingredient.unit ? ` ${ingredient.unit}` : ""}
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="recipe-steps-heading">
                <h3 id="recipe-steps-heading">Étapes</h3>
                <ol>
                  {recipeDetails.steps.map((step) => (
                    <li key={step.stepNumber}>{step.description}</li>
                  ))}
                </ol>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
