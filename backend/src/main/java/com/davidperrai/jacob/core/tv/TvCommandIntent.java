package com.davidperrai.jacob.core.tv;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

public final class TvCommandIntent {

    private static final Pattern NEGATED_REQUEST =
            Pattern.compile("\\b(?:ne|n)\\b.{0,40}\\bpas\\b");
    private static final Pattern MUTE =
            Pattern.compile("\\b(?:muet|mute|coupe(?:r)? le son|retablis le son|remets le son)\\b");
    private static final Pattern VOLUME_UP =
            Pattern.compile("\\b(?:augmente|monte|hausse)\\b.{0,35}\\b(?:volume|son)\\b"
                    + "|\\b(?:plus fort|monte le son)\\b");
    private static final Pattern VOLUME_DOWN =
            Pattern.compile("\\b(?:baisse|diminue|reduis)\\b.{0,35}\\b(?:volume|son)\\b"
                    + "|\\b(?:moins fort|baisse le son)\\b");
    private static final Pattern TURN_OFF =
            Pattern.compile("\\b(?:eteins?|eteint|eteindre|arrete|arreter|stoppe|coupe|couper)\\b"
                    + ".{0,35}\\b(?:la )?(?:television|tele|tv)\\b");
    private static final Pattern PAUSE =
            Pattern.compile("\\b(?:pause|mets en pause|mettre en pause)\\b");
    private static final Pattern PLAY =
            Pattern.compile("\\b(?:reprends|reprendre|relance|relancer|lance|lancer)\\b"
                    + ".{0,30}\\b(?:lecture|film|video|tele|tv|media)\\b"
                    + "|\\breprends? la lecture\\b");

    private TvCommandIntent() {
    }

    public static Optional<TvCommand> detect(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return Optional.empty();
        }

        String normalized = normalize(prompt);
        if (NEGATED_REQUEST.matcher(normalized).find()) {
            return Optional.empty();
        }

        if (MUTE.matcher(normalized).find()) {
            return Optional.of(TvCommand.TOGGLE_MUTE);
        }
        if (VOLUME_UP.matcher(normalized).find()) {
            return Optional.of(TvCommand.VOLUME_UP);
        }
        if (VOLUME_DOWN.matcher(normalized).find()) {
            return Optional.of(TvCommand.VOLUME_DOWN);
        }
        if (TURN_OFF.matcher(normalized).find()) {
            return Optional.of(TvCommand.TURN_OFF);
        }
        if (PAUSE.matcher(normalized).find()) {
            return Optional.of(TvCommand.PAUSE);
        }
        if (PLAY.matcher(normalized).find()) {
            return Optional.of(TvCommand.PLAY);
        }
        return Optional.empty();
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.FRENCH)
                .replaceAll("[^a-z0-9' ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
