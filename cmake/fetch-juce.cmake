include (FetchContent)
fetchcontent_declare (juce GIT_REPOSITORY https://github.com/juce-framework/JUCE
                      GIT_TAG 6.1.2 GIT_SUBMODULES "")

fetchcontent_makeavailable (juce)

